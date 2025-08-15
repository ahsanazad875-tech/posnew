import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TextField, Select, MenuItem, Grid, Chip,
  LinearProgress, Alert, Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const SalesReport = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('daily');
  const [dateFilter, setDateFilter] = useState(new Date());

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        let ordersQuery;

        if (currentUser?.role === 'admin') {
          ordersQuery = collection(db, 'orders');
        } else {
          ordersQuery = query(
            collection(db, 'orders'),
            where('branchId', '==', currentUser.branchId)
          );
        }

        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => {
          const orderData = doc.data();

          const total = parseFloat(orderData.total) || 0;
          const totalCost = parseFloat(orderData.totalCost) || 0;
          const totalProfit = parseFloat(orderData.totalProfit) || 0;
          const profitMargin = parseFloat(orderData.profitMargin) || 0;
          const hasNegativeProfit = totalProfit < 0;


          return {
            id: doc.id,
            ...orderData,
            date: orderData.timestamp?.toDate() || new Date(),
            customerName: orderData.customerName || 'Walk-in Customer',
            total,
            totalCost,
            totalProfit,
            profitMargin,
            hasNegativeProfit,
            items: orderData.items || []
          };
        });

        setOrders(ordersData);
        setFilteredOrders(ordersData);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError("Failed to load sales data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const fetchBranches = async () => {
      if (currentUser?.role !== 'admin') return;
      const snapshot = await getDocs(collection(db, 'branches'));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBranches(data);
    };

    fetchOrders();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (loading) return;

    let results = [...orders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(order => 
        order.customerName.toLowerCase().includes(term) ||
        order.id.toLowerCase().includes(term)
      );
    }

    results = results.filter(order => {
      const isDateMatch = (() => {
        const orderDate = order.date;
        switch (filterType) {
          case 'daily':
            return orderDate >= startOfDay(dateFilter) && orderDate <= endOfDay(dateFilter);
          case 'monthly':
            return orderDate >= startOfMonth(dateFilter) && orderDate <= endOfMonth(dateFilter);
          case 'yearly':
            return orderDate >= startOfYear(dateFilter) && orderDate <= endOfYear(dateFilter);
          default:
            return true;
        }
      })();

      let branchId = selectedBranch;

      if(currentUser?.role !== 'admin'){
        branchId = currentUser.branchId;
      }

      const isBranchMatch = branchId === '' || order.branchId === branchId;
    
      return isDateMatch && isBranchMatch;
    });
    

    setFilteredOrders(results);
  }, [filterType, selectedBranch, dateFilter, searchTerm, orders, loading]);

  const prepareChartData = () => {
    const dataMap = new Map();

    filteredOrders.forEach(order => {
      let dateKey;
      switch(filterType) {
        case 'daily':
          dateKey = format(order.date, 'MMM dd');
          break;
        case 'monthly':
          dateKey = format(order.date, 'MMM yyyy');
          break;
        case 'yearly':
          dateKey = format(order.date, 'yyyy');
          break;
        default:
          dateKey = format(order.date, 'MMM dd');
      }

      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, {
          date: dateKey,
          totalSales: 0,
          totalCost: 0,
          totalProfit: 0,
          orders: 0,
          ordersWithNegativeProfit: 0
        });
      }

      const periodData = dataMap.get(dateKey);
      periodData.totalSales += order.total;
      periodData.totalCost += order.totalCost;
      periodData.totalProfit += order.totalProfit;
      periodData.orders += 1;
      
      if (order.hasNegativeProfit) {
        periodData.ordersWithNegativeProfit += 1;
      }
    });

    return Array.from(dataMap.values()).sort((a, b) => {
      if (filterType === 'yearly') return a.date.localeCompare(b.date);
      return new Date(a.date) - new Date(b.date);
    });
  };

  const renderItemsTooltip = (items) => (
    <Box sx={{ p: 1, maxWidth: 300 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
        Purchased Items
      </Typography>
      <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
        {items.map((item, index) => (
          <Box key={index} sx={{ mb: 1.5, borderBottom: '1px solid #eee', pb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: '500' }}>
              {item.productName}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption">
                Qty: {item.quantity}
              </Typography>
              <Typography variant="caption">
                Price: Rs.{item.sellPrice.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption">
                Cost: Rs.{item.costPrice.toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: (item.sellPrice * item.quantity - item.costPrice * item.quantity) >= 0 ? 
                  'success.main' : 'error.main'
              }}>
                Profit: Rs.{(item.sellPrice * item.quantity - item.costPrice * item.quantity).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const chartData = prepareChartData();
  const totalSales = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const totalCost = filteredOrders.reduce((sum, order) => sum + order.totalCost, 0);
  const totalProfit = filteredOrders.reduce((sum, order) => sum + order.totalProfit, 0);
  const profitMargin = (totalProfit / totalSales) * 100 || 0;
  const ordersWithNegativeProfit = filteredOrders.filter(order => order.hasNegativeProfit).length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Sales Report
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search orders"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Customer name or order ID"
            />
          </Grid>
          {currentUser?.role === 'admin' && (
          <Grid item xs={6} md={2}>
            <Select
              fullWidth
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches.map(branch => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          )}
          <Grid item xs={6} md={2}>
            <Select
              fullWidth
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              variant="outlined"
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {filterType === 'daily' && (
                <DatePicker
                  label="Select Date"
                  value={dateFilter}
                  onChange={setDateFilter}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              )}
              {filterType === 'monthly' && (
                <DatePicker
                  views={['year', 'month']}
                  label="Select Month"
                  value={dateFilter}
                  onChange={setDateFilter}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              )}
              {filterType === 'yearly' && (
                <DatePicker
                  views={['year']}
                  label="Select Year"
                  value={dateFilter}
                  onChange={setDateFilter}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              )}
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1">
                <strong>Orders:</strong> {filteredOrders.length} | 
                <strong> Sales:</strong> Rs.{totalSales.toFixed(2)} | 
                <strong> Profit:</strong> Rs.{totalProfit.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Profit Margin: {profitMargin.toFixed(1)}% | 
                Cost: Rs.{totalCost.toFixed(2)} | 
                {ordersWithNegativeProfit > 0 && (
                  <span style={{ color: 'red' }}>
                    {ordersWithNegativeProfit} order(s) with negative profit
                  </span>
                )}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <LinearProgress />
      ) : (
        <>
          <Paper sx={{ p: 3, mb: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Sales Analytics
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip 
                  formatter={(value, name) => [
                    `Rs.${value.toFixed(2)}`, 
                    name === 'totalProfit' ? 'Profit' : 
                    name === 'totalCost' ? 'Cost' : 'Sales'
                  ]}
                />
                <Legend />
                <Bar dataKey="totalSales" fill="#3f51b5" name="Sales" />
                <Bar dataKey="totalCost" fill="#ff9800" name="Cost" />
                <Bar dataKey="totalProfit" fill="#4caf50" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Details ({filteredOrders.length} records)
            </Typography>
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date/Time</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="center">Items</TableCell>
                    <TableCell align="right">Total (Rs.)</TableCell>
                    <TableCell align="right">Cost (Rs.)</TableCell>
                    <TableCell align="right">Profit (Rs.)</TableCell>
                    <TableCell align="right">Margin</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <TableRow 
                        key={order.id} 
                        hover
                        sx={{ 
                          backgroundColor: order.hasNegativeProfit ? 'rgba(255, 0, 0, 0.05)' : 'inherit',
                          '&:hover': {
                            backgroundColor: order.hasNegativeProfit ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.04)'
                          }
                        }}
                      >
                        <TableCell>{format(order.date, 'PPpp')}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell align="center">
                          <Tooltip 
                            title={renderItemsTooltip(order.items)} 
                            arrow 
                            enterTouchDelay={0}
                          >
                            <Chip 
                              label={order.items.length} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                              clickable
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">{order.total.toFixed(2)}</TableCell>
                        <TableCell align="right">{order.totalCost.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{
                          color: order.totalProfit >= 0 ? 'success.main' : 'error.main'
                        }}>
                          {order.totalProfit.toFixed(2)}
                        </TableCell>
                        <TableCell align="right" sx={{
                          color: order.profitMargin >= 0 ? 'success.main' : 'error.main'
                        }}>
                          {order.profitMargin.toFixed(1)}%
                        </TableCell>
                        <TableCell align="center">
                          {order.hasNegativeProfit ? (
                            <Chip 
                              label="Negative Profit" 
                              size="small" 
                              color="error" 
                              variant="outlined"
                            />
                          ) : (
                            <Chip 
                              label="Positive" 
                              size="small" 
                              color="success" 
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No orders found matching your criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default SalesReport;