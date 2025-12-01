import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
  Pagination
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Logout as LogoutIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';
import toast, { Toaster } from 'react-hot-toast';
import { api } from '../services/api';
import './DataTable.css';

const DataTable = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState([{ id: 'name', desc: false }]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.getUsers(page, pageSize, searchTerm, sortBy);
      setData(result.data);
      setTotalCount(result.total);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({ open: true, message: 'Failed to load data. Please check your authentication and permissions.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, sortBy, page, pageSize]);

  useEffect(() => {
    setPage(1); // Reset to first page when searching
  }, [searchTerm]);

  // Handle sorting
  const handleSort = (columnId) => {
    setSortBy(prev => {
      const existing = prev.find(s => s.id === columnId);
      if (existing) {
        return existing.desc ? [] : [{ id: columnId, desc: true }];
      }
      return [{ id: columnId, desc: false }];
    });
  };

  // Column definitions with responsive visibility
  const columns = useMemo(() => [
    {
      header: 'ID',
      accessorKey: 'id',
      enableSorting: true,
      meta: {
        responsive: {
          xs: false, // Hide on mobile
          sm: false, // Hide on small screens
          md: true   // Show on medium+ screens
        }
      }
    },
    {
      header: 'User',
      accessorKey: 'name',
      cell: ({ row }) => (
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={row.original.avatar} alt={row.original.name} sx={{ width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 } }}>
            {row.original.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: { xs: '14px', md: '16px' } }}>
              {row.original.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {row.original.email}
            </Typography>
          </Box>
        </Box>
      ),
      enableSorting: true,
      meta: {
        responsive: {
          xs: true,  // Always show on mobile
          sm: true,  // Show on small screens
          md: true   // Show on medium+ screens
        }
      }
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: ({ row }) => (
        <Chip
          label={row.original.role}
          color={row.original.role === 'Admin' ? 'primary' : row.original.role === 'Editor' ? 'secondary' : 'default'}
          size="small"
          variant="outlined"
        />
      ),
      enableSorting: true,
      meta: {
        responsive: {
          xs: false, // Hide on mobile
          sm: true,  // Show on small screens
          md: true   // Show on medium+ screens
        }
      }
    },
    {
      header: 'Department',
      accessorKey: 'department',
      cell: ({ row }) => (
        <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' } }}>
          {row.original.department}
        </Typography>
      ),
      enableSorting: true,
      meta: {
        responsive: {
          xs: false, // Hide on mobile
          sm: false, // Hide on small screens
          md: true   // Show on medium+ screens
        }
      }
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Chip
          label={row.original.status}
          color={row.original.status === 'Active' ? 'success' : 'error'}
          size="small"
          variant="filled"
        />
      ),
      enableSorting: true,
      meta: {
        responsive: {
          xs: true,  // Show on mobile
          sm: true,  // Show on small screens
          md: true   // Show on medium+ screens
        }
      }
    },
    {
      header: 'Last Login',
      accessorKey: 'lastLogin',
      cell: ({ row }) => (
        <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', lg: 'block' } }}>
          {row.original.lastLogin}
        </Typography>
      ),
      enableSorting: true,
      meta: {
        responsive: {
          xs: false, // Hide on mobile
          sm: false, // Hide on small screens
          md: false, // Hide on medium screens
          lg: true   // Show on large screens
        }
      }
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <Box display="flex" gap={1}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedRow(row.original);
                setDetailOpen(true);
              }}
              color="primary"
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => toast.info('Edit functionality would open here')}
              color="info"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedRow(row.original);
                setDeleteConfirmOpen(true);
              }}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
      meta: {
        responsive: {
          xs: true,  // Show on mobile
          sm: true,  // Show on small screens
          md: true   // Show on medium+ screens
        }
      }
    }
  ], []);

  // Filter columns based on screen size for responsive behavior
  const visibleColumns = useMemo(() => {
    if (isMobile) {
      // Mobile: User, Status, Actions
      return columns.filter(col =>
        col.accessorKey === 'name' ||
        col.accessorKey === 'status' ||
        col.id === 'actions'
      );
    } else if (isTablet) {
      // Tablet: User, Role, Status, Actions
      return columns.filter(col =>
        col.accessorKey === 'name' ||
        col.accessorKey === 'role' ||
        col.accessorKey === 'status' ||
        col.id === 'actions'
      );
    } else {
      // Desktop: All columns except responsive ones
      return columns.filter(col => {
        if (col.meta?.responsive) {
          // For responsive columns, show based on current breakpoint
          if (col.accessorKey === 'id') {
            return false; // Hide ID on all screens
          }
          if (col.accessorKey === 'department') {
            return true; // Show on md+
          }
          if (col.accessorKey === 'lastLogin') {
            return false; // Hide on md, show on lg+
          }
        }
        return true;
      });
    }
  }, [columns, isMobile, isTablet]);

  const table = useReactTable({
    data,
    columns: visibleColumns,
    state: {
      sorting: sortBy
    },
    onSortingChange: setSortBy,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: false
  });

  const handleDelete = async () => {
    if (!selectedRow) return;

    try {
      await api.deleteUser(selectedRow.id);
      toast.success('User deleted successfully!');
      setDeleteConfirmOpen(false);
      setSelectedRow(null);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user. Please check your permissions.');
    }
  };

  const handleRefresh = () => {
    fetchData();
    toast.success('Data refreshed!');
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(1);
  };

  return (
    <Box className="datatable-container">
      <Toaster position="top-right" />

      {/* Search Bar - Moved to top without header */}
      <Paper className="datatable-header" elevation={0} sx={{ borderRadius: 3, p: 3, mb: 3 }}>
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={{ xs: 2, sm: 0 }} mb={2}>
          <Box>
            <Typography variant="h5" fontWeight="700" className="gradient-text">
              User Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your team members and their permissions
            </Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              fullWidth
              placeholder="Search users by name, email, or role..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset to first page when searching
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'transparent'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(102, 126, 234, 0.8)'
                  },
                  '& .MuiInputBase-input': {
                    color: '#333'
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(102, 126, 234, 0.6)',
                    opacity: 1
                  },
                  minWidth: { xs: '100%', sm: 300, md: 400 }
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'transparent',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.8)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                    boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                  },
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => toast.success('Add user functionality would open here')}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#667eea',
                fontWeight: 700,
                borderRadius: '12px',
                border: '2px solid rgba(102, 126, 234, 0.8)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                  borderColor: '#667eea'
                },
                px: 3,
                py: 1
              }}
            >
              Add User
            </Button>
            <Tooltip title="Refresh Data">
              <IconButton
                onClick={handleRefresh}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: '#667eea',
                  borderRadius: '12px',
                  border: '2px solid rgba(102, 126, 234, 0.8)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    transform: 'scale(1.05)',
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                    borderColor: '#667eea'
                  },
                  '&:active': {
                    transform: 'scale(0.98)'
                  }
                }}
              >
                <RefreshIcon sx={{ fontSize: 24, color: '#667eea' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Table */}
      <Paper className="datatable-paper" elevation={3}>
        <TableContainer>
          <Table sx={{ minWidth: { xs: 600, sm: 700, md: 800 } }}>
            <TableHead>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableCell
                      key={header.id}
                      className="table-header-cell"
                      sx={{
                        fontSize: { xs: '12px', md: '14px' },
                        py: { xs: 1, md: 2 }
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <Box display="flex" alignItems="center" gap={1}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <TableSortLabel
                              active={sortBy.length > 0 && sortBy[0].id === header.id}
                              direction={sortBy.length > 0 && sortBy[0].id === header.id ? (sortBy[0].desc ? 'desc' : 'asc') : 'asc'}
                              onClick={() => handleSort(header.id)}
                              className="sort-label"
                            />
                          )}
                        </Box>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" className="loading-cell">
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      Loading users...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" className="empty-cell">
                    <Typography variant="body1" color="text.secondary">
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} hover className="table-row">
                    {row.getVisibleCells().map(cell => (
                      <TableCell
                        key={cell.id}
                        className="table-cell"
                        sx={{
                          fontSize: { xs: '12px', md: '14px' },
                          py: { xs: 1, md: 2 }
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2, px: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            Rows per page:
          </Typography>
          <TextField
            select
            size="small"
            value={pageSize}
            onChange={handlePageSizeChange}
            sx={{
              width: 120,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'transparent',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(102, 126, 234, 0.8)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                  boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                },
              }
            }}
          >
            {[10, 25, 50, 100, 200].map((size) => (
              <MenuItem key={size} value={size}>
                {size} / page
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Pagination
          count={Math.ceil(totalCount / pageSize)}
          page={page}
          onChange={handlePageChange}
          color="primary"
          variant="outlined"
          shape="rounded"
          siblingCount={1}
          boundaryCount={1}
          sx={{
            '& .MuiPaginationItem-root': {
              borderRadius: '8px',
              margin: '0 2px',
              borderColor: 'rgba(102, 126, 234, 0.5)',
              color: '#667eea',
              '&.Mui-selected': {
                backgroundColor: '#667eea',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#764ba2',
                }
              },
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
              }
            }
          }}
        />
        <Typography variant="body2" color="text.secondary">
          {totalCount} total
        </Typography>
      </Box>

      {/* Detail Modal */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
        className="detail-modal"
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="700">
              User Details
            </Typography>
            <Chip
              label={selectedRow?.status || ''}
              color={selectedRow?.status === 'Active' ? 'success' : 'error'}
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRow && (
            <Grid container spacing={3}>
              <Grid item xs={12} display="flex" justifyContent="center">
                <Avatar src={selectedRow.avatar} alt={selectedRow.name} sx={{ width: 80, height: 80 }}>
                  {selectedRow.name.charAt(0)}
                </Avatar>
              </Grid>
              <Grid item xs={12} textAlign="center">
                <Typography variant="h6" fontWeight="600">
                  {selectedRow.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedRow.email}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  Role
                </Typography>
                <Chip
                  label={selectedRow.role}
                  color={selectedRow.role === 'Admin' ? 'primary' : selectedRow.role === 'Editor' ? 'secondary' : 'default'}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  Department
                </Typography>
                <Typography variant="body2">{selectedRow.department}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  Last Login
                </Typography>
                <Typography variant="body2">{selectedRow.lastLogin}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  Created
                </Typography>
                <Typography variant="body2">{selectedRow.createdAt}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  Permissions
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {selectedRow.permissions.map((perm, index) => (
                    <Chip key={index} label={perm} size="small" variant="outlined" />
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)} variant="outlined">
            Close
          </Button>
          <Button onClick={() => toast.info('Edit functionality would open here')} variant="contained" color="primary">
            Edit User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'error.main' }}>
              <DeleteIcon />
            </Avatar>
            <Typography variant="h6" fontWeight="700">
              Delete User
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete{' '}
            <strong>{selectedRow?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DataTable;