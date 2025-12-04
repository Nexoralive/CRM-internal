import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Collapse,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
    Button,
} from '@mui/material';
import { WhatsApp, Phone, ExpandMore, ExpandLess } from '@mui/icons-material';
import { fetchCustomers, fetchCustomerOptions } from './customersSlice';
import CommunicationDialog from '../integrations/CommunicationDialog';
import type { AppDispatch, RootState } from '../../store/store';

const CustomersPage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { items: customers, loading, error, options } = useSelector((state: RootState) => state.customers);
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const websiteId = user?.websiteId || '6e9a7f98-6181-49d7-b759-7365ac7328f6';

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [lastDepositDate, setLastDepositDate] = useState('');
    const [website, setWebsite] = useState('');
    const [branch, setBranch] = useState('');
    // applied filter state (used to actually query)
    const [appliedSearch, setAppliedSearch] = useState('');
    const [appliedStatus, setAppliedStatus] = useState('');
    const [appliedLastDepositDate, setAppliedLastDepositDate] = useState('');
    const [appliedWebsite, setAppliedWebsite] = useState('');
    const [appliedBranch, setAppliedBranch] = useState('');

    const [contactDialogOpen, setContactDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string; phone: string } | null>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchCustomerOptions(undefined));
    }, [dispatch]);

    useEffect(() => {
        if (website) {
            dispatch(fetchCustomerOptions(website));
        }
    }, [dispatch, website]);

    // Fetch customers whenever applied filters change
    useEffect(() => {
        dispatch(fetchCustomers({
            websiteId,
            search: appliedSearch || undefined,
            status: appliedStatus || undefined,
            lastDepositDate: appliedLastDepositDate || undefined,
            website: appliedWebsite || undefined,
            branch: appliedBranch || undefined
        }));
    }, [dispatch, websiteId, appliedSearch, appliedStatus, appliedLastDepositDate, appliedWebsite, appliedBranch]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const handleStatusChange = (e: any) => {
        setStatusFilter(e.target.value as string);
    };
    const handleApplyFilters = () => {
        setAppliedSearch(search);
        setAppliedStatus(statusFilter);
        setAppliedLastDepositDate(lastDepositDate);
        setAppliedWebsite(website);
        setAppliedBranch(branch);
    };
    const handleClearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setLastDepositDate('');
        setWebsite('');
        setBranch('');
        setAppliedSearch('');
        setAppliedStatus('');
        setAppliedLastDepositDate('');
        setAppliedWebsite('');
        setAppliedBranch('');
    };

    // UI for filters
    const handleContactClick = (e: React.MouseEvent, customer: any) => {
        e.stopPropagation();
        setSelectedCustomer({
            id: customer.id,
            name: customer.username,
            phone: customer.phone
        });
        setContactDialogOpen(true);
    };

    // UI for filters
    const filterBox = (
        <Box display="flex" alignItems="center" mb={2} gap={2} flexWrap="wrap">
            <TextField
                label="Search"
                variant="outlined"
                size="small"
                value={search}
                onChange={handleSearchChange}
                sx={{ minWidth: 200 }}
            />
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                    labelId="status-filter-label"
                    label="Status"
                    value={statusFilter}
                    onChange={handleStatusChange}
                >
                    <MenuItem value=""><em>All</em></MenuItem>
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="one_time_deposit">One‑Time Deposit</MenuItem>
                    <MenuItem value="retained">Retained</MenuItem>
                    <MenuItem value="churned">Churned</MenuItem>
                </Select>
            </FormControl>
            <TextField
                label="Last Deposit Date"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={lastDepositDate}
                onChange={(e) => setLastDepositDate(e.target.value)}
                onFocus={() => {
                    if (!lastDepositDate) {
                        const d = new Date();
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        setLastDepositDate(`${yyyy}-${mm}-${dd}`);
                    }
                }}
            />
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="website-filter-label">Website</InputLabel>
                <Select
                    labelId="website-filter-label"
                    label="Website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                >
                    <MenuItem value=""><em>All</em></MenuItem>
                    {options?.websites.map((w) => (
                        <MenuItem key={w} value={w}>{w}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="branch-filter-label">Branch</InputLabel>
                <Select
                    labelId="branch-filter-label"
                    label="Branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                >
                    <MenuItem value=""><em>All</em></MenuItem>
                    {options?.branches.map((b) => (
                        <MenuItem key={b} value={b}>{b}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                <Button variant="outlined" size="small" onClick={handleClearFilters}>
                    Clear
                </Button>
                <Button variant="contained" size="small" onClick={handleApplyFilters}>
                    Apply
                </Button>
            </Box>
        </Box>
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'info';
            case 'one_time_deposit': return 'warning';
            case 'retained': return 'success';
            case 'churned': return 'error';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                My Customers
            </Typography>
            <Paper sx={{ p: 1, mb: 2 }}>
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ px: 1, py: 0.5, cursor: 'pointer' }}
                    onClick={() => setFiltersOpen(v => !v)}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Filters</Typography>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            setFiltersOpen(v => !v);
                        }}
                    >
                        {filtersOpen ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </Box>
                <Collapse in={filtersOpen} unmountOnExit>
                    <Box sx={{ pt: 1, px: 1, pb: 1 }}>
                        {filterBox}
                    </Box>
                </Collapse>
            </Paper>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="customers table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Username</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Total Deposits</TableCell>
                            <TableCell>Last Deposit</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {customers.map((customer) => (
                            <TableRow
                                key={customer.id}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                hover
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/customers/${customer.id}`)}
                            >
                                <TableCell component="th" scope="row">
                                    {customer.username}
                                </TableCell>
                                <TableCell>{customer.email}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={customer.status}
                                        color={getStatusColor(customer.status) as any}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{customer.category}</TableCell>
                                <TableCell align="right">${Number(customer.totalDeposits).toFixed(2)}</TableCell>
                                <TableCell>
                                    {customer.lastDepositDate ? new Date(customer.lastDepositDate).toLocaleDateString() : '-'}
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="WhatsApp">
                                        <IconButton
                                            color="success"
                                            onClick={(e) => handleContactClick(e, customer)}
                                            size="small"
                                        >
                                            <WhatsApp />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Call">
                                        <IconButton
                                            color="primary"
                                            onClick={(e) => handleContactClick(e, customer)}
                                            size="small"
                                        >
                                            <Phone />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {customers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    No customers found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <CommunicationDialog
                open={contactDialogOpen}
                onClose={() => setContactDialogOpen(false)}
                customerId={selectedCustomer?.id || ''}
                customerName={selectedCustomer?.name || ''}
                customerPhone={selectedCustomer?.phone || ''}
            />
        </Box>
    );
};

export default CustomersPage;
