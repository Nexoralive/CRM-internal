import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Chip,
  Tabs,
  Tab,
  MenuItem,
  Menu
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InteractionForm from '../interactions/InteractionForm';
import InteractionList from '../interactions/InteractionList';
import CommunicationDialog from '../integrations/CommunicationDialog';
import FollowUpForm from '../follow-ups/FollowUpForm';
import api from '../../utils/axios';
import { isAxiosError } from 'axios';
import {
  fetchCustomers,
  fetchCustomerTags,
  updateCustomerTag
} from './customersSlice';
import type { AppDispatch, RootState } from '../../store/store';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: string;
  remark: string;
  panel: string;
  website: string;
}

interface ClientTransactionData {
  client: string;
  customerId?: string | null;
  tagId?: string | null;
  tag?: { id?: string; name: string; color: string } | null;
  branch: string;
  website: string;
  deposits: Transaction[];
  withdrawals: Transaction[];
  summary: {
    totalDeposits: number;
    totalWithdrawals: number;
    depositCount: number;
    withdrawalCount: number;
    lastDepositDate?: string | null;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`transaction-tabpanel-${index}`}
      aria-labelledby={`transaction-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const TransactionClientDetailPage = () => {
  const { client } = useParams<{ client: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { items: customers } = useSelector(
    (state: RootState) => state.customers
  );

  const [data, setData] = useState<ClientTransactionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const { tags } = useSelector((state: RootState) => state.customers);
  const [selectedTagId, setSelectedTagId] = useState<string | ''>('');
  const [tagAnchorEl, setTagAnchorEl] = useState<null | HTMLElement>(null);

  const customer = customers.find(c => c.username === client);

  useEffect(() => {
    if (client && !customer) {
      dispatch(fetchCustomers({ search: client }));
    }
  }, [dispatch, client, customer]);

  useEffect(() => {
    // Load available tags once
    dispatch(fetchCustomerTags());
  }, [dispatch]);

  useEffect(() => {
    // Determine initial selection with priority:
    // 1) API data.tag.id
    // 2) Match API data.tag.name to fetched tags list
    // 3) API data.tagId
    // 4) Customer relation tag.id
    // 5) Customer tagId
    let initial: string | '' = '';
    if (data?.tag) {
      if (data.tag.id) {
        initial = data.tag.id as string;
      } else if (tags.length && data.tag.name) {
        const match = tags.find(
          t => t.name.toLowerCase() === data.tag!.name.toLowerCase()
        );
        if (match) {
          initial = match.id;
        }
      }
    }
    if (!initial && data?.tagId) {
      initial = data.tagId || '';
    }
    if (!initial && customer?.tag?.id) {
      initial = customer.tag.id;
    }
    if (!initial && customer?.tagId) {
      initial = customer.tagId;
    }
    setSelectedTagId(initial || '');
  }, [data?.tag, data?.tagId, customer?.tag?.id, customer?.tagId, tags]);

  const handleOpenTagMenu = (event: React.MouseEvent<HTMLElement>) => {
    setTagAnchorEl(event.currentTarget);
  };
  const handleCloseTagMenu = () => setTagAnchorEl(null);
  const handleSelectTag = (newTagId: string) => {
    setSelectedTagId(newTagId);
    setTagAnchorEl(null);
    if (data?.customerId) {
      dispatch(
        updateCustomerTag({
          id: data.customerId as string,
          tagId: newTagId || null
        })
      );
    }
  };

  useEffect(() => {
    const fetchClientTransactions = async () => {
      if (!client) return;

      setLoading(true);
      setError(null);
      try {
        const response = await api.get(
          `/transactions/clients/${encodeURIComponent(client)}`,
          {
            params: { client }
          }
        );
        setData(response.data);
      } catch (err: unknown) {
        const message =
          isAxiosError(err) && typeof err.response?.data?.message === 'string'
            ? err.response.data.message
            : 'Failed to fetch client transactions';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchClientTransactions();
  }, [client]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  // Safely convert to numbers
  const totalDeposits = Number(data.summary.totalDeposits) || 0;
  const totalWithdrawals = Number(data.summary.totalWithdrawals) || 0;
  const netBalance = totalDeposits - totalWithdrawals;

  // Get last deposit date from summary
  const lastDepositDate = data.summary.lastDepositDate;

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/customers/transaction-clients')}
        sx={{ mb: 2 }}
      >
        Back to Transaction Clients
      </Button>

      <Grid container spacing={3}>
        {/* Left Sidebar - Client Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              {data.client}
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              Transaction Client
            </Typography>
            <Chip
              label={netBalance >= 0 ? 'Positive Balance' : 'Negative Balance'}
              color={netBalance >= 0 ? 'success' : 'error'}
              sx={{ mt: 1 }}
            />

            <Box mt={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Tag
              </Typography>
              <Box display="flex" gap={1} alignItems="center" mt={1}>
                {(() => {
                  const activeTag =
                    (selectedTagId && tags.find(t => t.id === selectedTagId)) ||
                    data?.tag ||
                    customer?.tag ||
                    null;
                  const label = activeTag ? activeTag.name : 'No Tag';
                  const bg = activeTag?.color || '#e0e0e0';
                  const textColor = '#fff';
                  return (
                    <Chip
                      label={label}
                      onClick={handleOpenTagMenu}
                      sx={{ bgcolor: bg, color: textColor, cursor: 'pointer' }}
                    />
                  );
                })()}
              </Box>
              <Menu
                anchorEl={tagAnchorEl}
                open={Boolean(tagAnchorEl)}
                onClose={handleCloseTagMenu}
              >
                <MenuItem onClick={() => handleSelectTag('')}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      bgcolor: '#e0e0e0',
                      borderRadius: '50%',
                      mr: 1
                    }}
                  />
                  None
                </MenuItem>
                {tags.map(tag => (
                  <MenuItem
                    key={tag.id}
                    onClick={() => handleSelectTag(tag.id)}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        bgcolor: tag.color,
                        borderRadius: '50%',
                        mr: 1
                      }}
                    />
                    {tag.name}
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => setContactDialogOpen(true)}
            >
              Contact Client
            </Button>

            <Divider sx={{ my: 2 }} />

            <Box mt={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Branch
              </Typography>
              <Typography variant="body1">{data.branch}</Typography>
            </Box>

            <Box mt={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Website
              </Typography>
              <Typography variant="body1">{data.website}</Typography>
            </Box>

            <Box mt={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Created Date
              </Typography>
              <Typography variant="body1">
                {customer?.createdAt
                  ? new Date(customer.createdAt).toLocaleDateString()
                  : '-'}
              </Typography>
            </Box>

            <Box mt={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Language
              </Typography>
              <Typography variant="body1">
                {customer?.language || '-'}
              </Typography>
            </Box>

            <Box mt={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Retention RM
              </Typography>
              <Typography variant="body1">
                {customer?.retentionRM || '-'}
              </Typography>
            </Box>

            <Box mt={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Pullback RM
              </Typography>
              <Typography variant="body1">
                {customer?.pullbackRM || '-'}
              </Typography>
            </Box>

            <Box mt={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Client Name
              </Typography>
              <Typography variant="body1">
                {customer?.clientName || client || '-'}
              </Typography>
            </Box>

            <Box mt={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Branch
              </Typography>
              <Typography variant="body1">
                {customer?.branch || data.branch || '-'}
              </Typography>
            </Box>

            <Box mt={2}>
              <Typography variant="subtitle2" color="textSecondary">
                ID Status
              </Typography>
              <Typography variant="body1">
                {customer?.idStatus || '-'}
              </Typography>
            </Box>

            <Box mt={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Game Interest
              </Typography>
              <Typography variant="body1">
                {customer?.gameInterest || '-'}
              </Typography>
            </Box>

            <Box mt={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Total Transactions
              </Typography>
              <Typography variant="h6">
                {data.summary.depositCount + data.summary.withdrawalCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side - Financial Overview & Transactions */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Financial Overview */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Financial Overview
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2">Total Deposits</Typography>
                <Typography variant="h4" color="success.main">
                  ${totalDeposits.toFixed(2)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2">Last Deposit Date</Typography>
                <Typography variant="h6">
                  {lastDepositDate
                    ? new Date(lastDepositDate).toLocaleDateString()
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2">Total Withdrawals</Typography>
                <Typography variant="h4" color="error.main">
                  ${totalWithdrawals.toFixed(2)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2">Net Balance</Typography>
                <Typography
                  variant="h4"
                  color={netBalance >= 0 ? 'success.main' : 'error.main'}
                >
                  ${netBalance.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Transaction History with Comments Tab */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Transaction History & Comments
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label={`Deposits (${data.summary.depositCount})`} />
                <Tab label={`Withdrawals (${data.summary.withdrawalCount})`} />
                <Tab label="Comments" />
                <Tab label="Follow-ups" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Panel</TableCell>
                      <TableCell>Website</TableCell>
                      <TableCell>Remark</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.deposits.map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`$${Number(transaction.amount).toFixed(2)}`}
                            color="success"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{transaction.panel}</TableCell>
                        <TableCell>{transaction.website}</TableCell>
                        <TableCell>{transaction.remark || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {data.deposits.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No deposits found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Panel</TableCell>
                      <TableCell>Website</TableCell>
                      <TableCell>Remark</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.withdrawals.map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`$${Number(transaction.amount).toFixed(2)}`}
                            color="error"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{transaction.panel}</TableCell>
                        <TableCell>{transaction.website}</TableCell>
                        <TableCell>{transaction.remark || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {data.withdrawals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No withdrawals found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box>
                <InteractionForm
                  customerId={(data.customerId as string) || ''}
                />
                <Box mt={3}>
                  <InteractionList
                    customerId={(data.customerId as string) || ''}
                  />
                </Box>
              </Box>
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <Box>
                <FollowUpForm customerId={(data.customerId as string) || ''} />
              </Box>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Communication Dialog */}
      <CommunicationDialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        customerId={client || ''}
        customerName={data.client}
        customerPhone=""
      />
    </Box>
  );
};

export default TransactionClientDetailPage;
