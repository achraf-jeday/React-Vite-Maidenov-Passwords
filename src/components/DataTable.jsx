import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { encryptPackData, decryptPackData, decryptPacks } from '../services/packEncryptionService';
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
  Refresh as RefreshIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  AccountCircle as UsernameIcon,
  Lock as PasswordIcon,
  Link as LinkIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';
import toast, { Toaster } from 'react-hot-toast';
import { api } from '../services/api';
import './DataTable.css';

const DataTable = ({ user }) => {
  const { user: authUser } = useAuth();
  const { getKey, isUnlocked } = useEncryption();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState([{ id: 'name', desc: false }]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    link: '',
    notes: ''
  });

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.getUsers(page, pageSize, searchTerm, sortBy);

      // Decrypt data if vault is unlocked
      if (isUnlocked && result.data && result.data.length > 0) {
        try {
          const encryptionKey = getKey();
          const decryptedData = await decryptPacks(result.data, encryptionKey);
          setData(decryptedData);
        } catch (decryptError) {
          console.error('Decryption error:', decryptError);
          toast.error('Failed to decrypt pack data. Please unlock your vault again.');
          setData(result.data); // Show encrypted data as fallback
        }
      } else {
        setData(result.data);
      }

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

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    link: '',
    notes: ''
  });

  const handleEditClick = (row) => {
    setSelectedRow(row.original);
    setEditFormData({
      id: row.original.id,
      name: row.original.name || '',
      email: row.original.email || '',
      username: row.original.username || '',
      password: row.original.password || '',
      link: typeof row.original.link === 'object' && row.original.link !== null ? row.original.link.uri || '' : row.original.link || '',
      notes: row.original.notes || ''
    });
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setSelectedRow(null);
    // Ensure focus is returned to a safe element
    setTimeout(() => {
      const table = document.querySelector('.datatable-container');
      if (table) {
        table.focus();
      }
    }, 0);
  };

  const handleEditSave = async () => {
    if (!selectedRow) return;

    // Add name validation similar to create
    if (!editFormData.name.trim()) {
      toast.error('Pack name is required!');
      return;
    }

    try {
      // Encrypt data before sending to backend
      let dataToSend = editFormData;

      if (isUnlocked) {
        try {
          const encryptionKey = getKey();
          dataToSend = await encryptPackData(editFormData, encryptionKey);
        } catch (encryptError) {
          console.error('Encryption error:', encryptError);
          toast.error('Failed to encrypt pack data. Please try again.');
          return;
        }
      }

      await api.updateUser(selectedRow.id, dataToSend);
      toast.success('User updated successfully!');
      setEditOpen(false);
      setSelectedRow(null);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user. Please check your permissions.');
    }
  };

const handleCopy = (value, label) => {
  if (!value) {
    toast.error(`No ${label} to copy.`);
    return;
  }
  navigator.clipboard.writeText(value).then(() => {
    toast.success(`${label} copied to clipboard!`);
  }).catch(() => {
    toast.error(`Failed to copy ${label}.`);
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
      header: 'Pack name',
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
            <Typography variant="body2" color="text.secondary" component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>
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
      header: 'Last Login',
      accessorKey: 'lastLogin',
      cell: ({ row }) => (
        <Typography variant="body2" color="text.secondary" component="span" sx={{ display: { xs: 'none', lg: 'block' } }}>
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
      cell: ({ row }) => {
              const email = row.original.email || '';
              const username = row.original.username || '';
              const password = row.original.password || '';
              const link = typeof row.original.link === 'object' && row.original.link !== null
                ? row.original.link.uri || ''
                : row.original.link || '';
              const notes = row.original.notes || '';

              return (
                <Box display="flex" gap={0.5} flexWrap="wrap">
                  <Tooltip title={email ? 'Copy Email' : 'No Email'}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(email, 'Email')}
                        disabled={!email}
                        color="primary"
                      >
                        <EmailIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={username ? 'Copy Username' : 'No Username'}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(username, 'Username')}
                        disabled={!username}
                        color="secondary"
                      >
                        <UsernameIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={password ? 'Copy Password' : 'No Password'}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(password, 'Password')}
                        disabled={!password}
                        color="warning"
                      >
                        <PasswordIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={link ? 'Copy Link' : 'No Link'}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(link, 'Link')}
                        disabled={!link}
                        color="success"
                      >
                        <LinkIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={notes ? 'Copy Notes' : 'No Notes'}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(notes, 'Notes')}
                        disabled={!notes}
                        sx={{
                          color: notes ? '#00bcd4' : undefined,
                          '&:hover': { bgcolor: notes ? 'rgba(0,188,212,0.08)' : undefined }
                        }}
                      >
                        <NotesIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(row)}
                        color="info"
                      >
                        <EditIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <span>
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
                    </span>
                  </Tooltip>
                </Box>
              );
            },
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
      // Mobile: User, Actions
      return columns.filter(col =>
        col.accessorKey === 'name' ||
        col.id === 'actions'
      );
    } else if (isTablet) {
      // Tablet: User, Last Login, Actions
      return columns.filter(col =>
        col.accessorKey === 'name' ||
        col.accessorKey === 'lastLogin' ||
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

  const handleCreateClick = () => {
    setCreateFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      link: '',
      notes: ''
    });
    setCreateOpen(true);
  };

  const handleCreateClose = () => {
    setCreateOpen(false);
    setTimeout(() => {
      const table = document.querySelector('.datatable-container');
      if (table) {
        table.focus();
      }
    }, 0);
  };

  const handleCreateSave = async () => {
    if (!createFormData.name.trim()) {
      toast.error('Pack name is required!');
      return;
    }

    if (!authUser) {
      toast.error('You must be logged in to create entries!');
      return;
    }

    try {
      // Encrypt data before sending to backend
      let dataToSend = createFormData;

      if (isUnlocked) {
        try {
          const encryptionKey = getKey();
          dataToSend = await encryptPackData(createFormData, encryptionKey);
        } catch (encryptError) {
          console.error('Encryption error:', encryptError);
          toast.error('Failed to encrypt pack data. Please try again.');
          return;
        }
      }

      await api.createUser(dataToSend, authUser.sub);
      toast.success('Pack created successfully!');
      setCreateOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error creating pack:', error);
      toast.error(error.message || 'Failed to create pack. Please check your permissions.');
    }
  };

  return (
    <Box className="datatable-container" tabIndex={-1}>
      <Toaster position="top-right" />

      {/* Search Bar - Moved to top without header */}
      <Paper
        elevation={3}
        sx={{
          borderRadius: 3,
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '160px',
            height: '160px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            transform: 'translate(30px, -30px)',
            boxShadow: '0 8px 32px rgba(255, 255, 255, 0.1)'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 40,
            left: 220,
            width: '60px',
            height: '60px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '50%'
          },
          '& .fancy-circle': {
            position: 'absolute',
            bottom: -20,
            right: 80,
            width: '120px',
            height: '120px',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '50%'
          }
        }}
      >
        <div className="fancy-circle"></div>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight="700" sx={{ letterSpacing: '0.5px' }}>
              Search Packs
            </Typography>
            <Typography variant="body2" component="span" sx={{ opacity: 0.9, mt: 0.5 }}>
              {searchTerm ? `Filtered by: "${searchTerm}"` : 'Filtered packs from total'}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Create New Pack">
              <span>
                <IconButton
                  onClick={handleCreateClick}
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    }
                  }}
                >
                  <AddIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Refresh Data">
              <span>
                <IconButton
                  onClick={handleRefresh}
                  disabled={loading}
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:disabled': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* Search Section */}
        <Box mb={3}>
          <TextField
            fullWidth
            placeholder="Search packs by name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // Reset to first page when searching
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#333',
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
                }
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
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          {loading ? (
            <CircularProgress size={28} sx={{ color: 'white' }} />
          ) : (
            <Typography variant="h2" fontWeight="800" sx={{ letterSpacing: '2px' }}>
              {totalCount.toLocaleString()}
            </Typography>
          )}
          <Box>
            <Chip
              label={loading ? 'Loading...' : searchTerm ? 'Filtered Count' : 'Live Count'}
              color="success"
              size="small"
              variant="outlined"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                fontWeight: 600
              }}
            />
          </Box>
        </Box>

        {!loading && (
          <Typography variant="caption" sx={{ opacity: 0.8, mt: 1 }}>
            Last updated: {new Date().toLocaleTimeString()}
          </Typography>
        )}
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
                        py: { xs: 1, md: 2 },
                        width: header.id === 'actions' ? '25%' : undefined
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
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }} component="span">
                      Loading users...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" className="empty-cell">
                    <Typography variant="body1" color="text.secondary" component="span">
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
                          py: { xs: 1, md: 2 },
                          width: cell.column.id === 'actions' ? '25%' : undefined
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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          mt: 2,
          px: 2,
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 0 }
        }}
      >
        {/* Left section: Rows per page */}
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary" component="span">
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

        {/* Middle section: Desktop Pagination (rich) */}
        <Box
          display={{ xs: 'none', md: 'flex' }}
          alignItems="center"
          justifyContent="center"
          width="auto"
        >
          <Pagination
            count={Math.ceil(totalCount / pageSize)}
            page={page}
            onChange={handlePageChange}
            color="primary"
            variant="outlined"
            shape="rounded"
            siblingCount={1}
            boundaryCount={0}
            showFirstButton={true}
            showLastButton={true}
            hidePrevButton={false}
            hideNextButton={false}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& .MuiPaginationItem-root': {
                borderRadius: '8px',
                margin: '0 2px',
                borderColor: 'rgba(102, 126, 234, 0.5)',
                color: '#667eea',
                minWidth: 40,
                height: 40,
                fontSize: 14,
                fontWeight: 600,
                padding: '0 12px',
                '&.Mui-selected': {
                  backgroundColor: '#667eea',
                  color: 'white',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    backgroundColor: '#764ba2',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                }
              },
              '& .MuiPaginationItem-ellipsis': {
                minWidth: 28,
                height: 28,
                fontSize: 14
              },
              '& .MuiPaginationItem-page': {
                transition: 'all 0.2s ease',
              }
            }}
          />
        </Box>

        {/* Middle section: Mobile Pagination (compact) */}
        <Box
          display={{ xs: 'flex', md: 'none' }}
          alignItems="center"
          justifyContent="center"
          width="100%"
        >
          <Pagination
            count={Math.ceil(totalCount / pageSize)}
            page={page}
            onChange={handlePageChange}
            color="primary"
            variant="outlined"
            shape="rounded"
            siblingCount={0}
            boundaryCount={0}
            showFirstButton={true}
            showLastButton={true}
            hidePrevButton={false}
            hideNextButton={false}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'nowrap',
              '& .MuiPaginationItem-root': {
                borderRadius: '8px',
                margin: '0 1px',
                borderColor: 'rgba(102, 126, 234, 0.5)',
                color: '#667eea',
                minWidth: 24,
                height: 24,
                fontSize: 10,
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
              },
              '& .MuiPaginationItem-ellipsis': {
                minWidth: 16,
                height: 16,
                fontSize: 10
              }
            }}
          />
        </Box>

        {/* Right section: Results text */}
        <Box display="flex" alignItems="center">
          <Typography variant="body2" color="text.secondary" component="span">
            Showing {Math.min((page - 1) * pageSize + 1, totalCount)} - {Math.min(page * pageSize, totalCount)} of {totalCount.toLocaleString()}
          </Typography>
        </Box>
      </Box>

      {/* Edit Modal */}
      <Dialog
        open={editOpen}
        onClose={handleEditClose}
        maxWidth="md"
        fullWidth
        keepMounted
        disableEnforceFocus
        className="edit-modal"
        PaperProps={{
          sx: {
            minWidth: { xs: '90vw', sm: '80vw', md: '60vw', lg: '50vw' },
            minHeight: { xs: '80vh', sm: '70vh', md: '60vh' },
            maxHeight: { xs: '90vh', sm: '80vh', md: '70vh' }
          }
        }}
      >
        <DialogTitle>
          Edit <i>{selectedRow?.name || 'Entry'}</i>
        </DialogTitle>
        <DialogContent dividers sx={{ width: '100%' }}>
          {selectedRow && (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
              width: '100%'
            }}>
              {/* Left Column - All fields except Notes */}
              <Box className="edit-left-column">
                <Grid container spacing={2}>
                  <Grid grid={12}>
                    <TextField
                      fullWidth
                      required
                      label="Name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      variant="outlined"
                    />
                  </Grid>

                  <Grid grid={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      variant="outlined"
                    />
                  </Grid>

                  <Grid grid={12}>
                    <TextField
                      fullWidth
                      label="Username"
                      value={editFormData.username}
                      onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                      variant="outlined"
                    />
                  </Grid>

                  <Grid grid={12}>
                    <TextField
                      fullWidth
                      label="Password"
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      variant="outlined"
                    />
                  </Grid>

                  <Grid grid={12}>
                    <TextField
                      fullWidth
                      label="Link"
                      value={typeof editFormData.link === 'object' && editFormData.link !== null ? editFormData.link.uri || '' : editFormData.link || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, link: e.target.value })}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Right Column - Notes field only */}
              <Box>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={12}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  variant="outlined"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Modal */}
      <Dialog
        open={createOpen}
        onClose={handleCreateClose}
        maxWidth="md"
        fullWidth
        keepMounted
        disableEnforceFocus
        className="edit-modal"
        PaperProps={{
          sx: {
            minWidth: { xs: '90vw', sm: '80vw', md: '60vw', lg: '50vw' },
            minHeight: { xs: '80vh', sm: '70vh', md: '60vh' },
            maxHeight: { xs: '90vh', sm: '80vh', md: '70vh' }
          }
        }}
      >
        <DialogTitle>
          Create New Pack
        </DialogTitle>
        <DialogContent dividers sx={{ width: '100%' }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
            width: '100%'
          }}>
            {/* Left Column - All fields except Notes */}
            <Box className="edit-left-column">
              <Grid container spacing={2}>
                <Grid grid={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    required
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    variant="outlined"
                  />
                </Grid>

                <Grid grid={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    variant="outlined"
                  />
                </Grid>

                <Grid grid={12}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={createFormData.username}
                    onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
                    variant="outlined"
                  />
                </Grid>

                <Grid grid={12}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    variant="outlined"
                  />
                </Grid>

                <Grid grid={12}>
                  <TextField
                    fullWidth
                    label="Link"
                    value={createFormData.link}
                    onChange={(e) => setCreateFormData({ ...createFormData, link: e.target.value })}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Right Column - Notes field only */}
            <Box>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={12}
                value={createFormData.notes}
                onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
                variant="outlined"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateClose} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleCreateSave} variant="contained" color="primary">
            Create Pack
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSelectedRow(null);
          // Ensure focus is returned to a safe element
          setTimeout(() => {
            const table = document.querySelector('.datatable-container');
            if (table) {
              table.focus();
            }
          }, 0);
        }}
        maxWidth="xs"
        fullWidth
        keepMounted
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'error.main' }}>
              <DeleteIcon />
            </Avatar>
            <Typography variant="h6" fontWeight="700">
              Delete Pack
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" component="span">
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
