import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
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
  CircularProgress,
  Alert,
  TextField,
  Chip,
  Button,
  IconButton,
  Tooltip,
  TablePagination,
  Grid,
  MenuItem
} from '@mui/material';
import { WhatsApp, Phone, ExpandMore, ExpandLess } from '@mui/icons-material';
import api from '../../utils/axios';
import CommunicationDialog from '../integrations/CommunicationDialog';

interface TransactionClient {
  client: string;
  branch: string;
  panel: string;
  website: string;
  status: string;
  transactionCount: number;
  totalDeposits: number;
  totalWithdrawals: number;
  lastDepositDate: string | null;
}

/* --------------------------------------------------------------- */
/*                     Component definition                         */
/* --------------------------------------------------------------- */
const TransactionClientsPage = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  /* --------------------------- State --------------------------- */
  const [clients, setClients] = useState<TransactionClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin =
    currentUser?.role === 'admin' || currentUser?.role === 'ADMIN';

  // Get user's website name (we'll need to fetch it or get from token)
  const [userWebsiteName, setUserWebsiteName] = useState<string | null>(
    currentUser?.websiteName || null
  );

  // filter state
  const [search, setSearch] = useState('');
  const [lastDepositDate, setLastDepositDate] = useState('');
  const [website, setWebsite] = useState('');
  const [panel, setPanel] = useState('');
  const [branch, setBranch] = useState('');
  const [firstDepositDate, setFirstDepositDate] = useState('');
  const [minTotalDeposits, setMinTotalDeposits] = useState<string>('');
  const [maxTotalDeposits, setMaxTotalDeposits] = useState<string>('');
  const [firstTransactionDate, setFirstTransactionDate] = useState('');
  const [lastTransactionDate, setLastTransactionDate] = useState('');
  const [firstWithdrawalDate, setFirstWithdrawalDate] = useState('');
  const [lastWithdrawalDate, setLastWithdrawalDate] = useState('');
  const [minTotalWithdrawals, setMinTotalWithdrawals] = useState<string>('');
  const [maxTotalWithdrawals, setMaxTotalWithdrawals] = useState<string>('');
  const [status, setStatus] = useState('');
  const [gameInterest, setGameInterest] = useState('');
  const [lastCallDate, setLastCallDate] = useState('');
  const [lastCallOutcome, setLastCallOutcome] = useState('');
  // applied filter state (used to actually query)
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedLastDepositDate, setAppliedLastDepositDate] = useState('');
  const [appliedWebsite, setAppliedWebsite] = useState('');
  const [appliedPanel, setAppliedPanel] = useState('');
  const [appliedBranch, setAppliedBranch] = useState('');
  const [appliedFirstDepositDate, setAppliedFirstDepositDate] = useState('');
  const [appliedMinTotalDeposits, setAppliedMinTotalDeposits] = useState<string>('');
  const [appliedMaxTotalDeposits, setAppliedMaxTotalDeposits] = useState<string>('');
  const [appliedFirstTransactionDate, setAppliedFirstTransactionDate] = useState('');
  const [appliedLastTransactionDate, setAppliedLastTransactionDate] = useState('');
  const [appliedFirstWithdrawalDate, setAppliedFirstWithdrawalDate] = useState('');
  const [appliedLastWithdrawalDate, setAppliedLastWithdrawalDate] = useState('');
  const [appliedMinTotalWithdrawals, setAppliedMinTotalWithdrawals] = useState<string>('');
  const [appliedMaxTotalWithdrawals, setAppliedMaxTotalWithdrawals] = useState<string>('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedGameInterest, setAppliedGameInterest] = useState('');
  const [appliedLastCallDate, setAppliedLastCallDate] = useState('');
  const [appliedLastCallOutcome, setAppliedLastCallOutcome] = useState('');

  // options for website / panel dropdowns
  const [options, setOptions] = useState<{
    websites: string[];
    panels: string[];
    branches: string[];
  }>({
    websites: [],
    panels: [],
    branches: []
  });

  // pagination
  const [page, setPage] = useState(0); // MUI page is 0‑based
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // contact dialog
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasLoadedOptions = useRef(false);
  const hasInitializedWebsite = useRef(false);
  const lastPanelsWebsite = useRef<string | null>(null);

  /* ---------------------- Load user's website name ----------------------- */
  useEffect(() => {
    if (isAdmin) {
      setUserWebsiteName(null);
      return;
    }

    if (currentUser?.websiteName) {
      setUserWebsiteName(currentUser.websiteName);
      return;
    }

    const loadUserWebsite = async () => {
      if (currentUser?.websiteId) {
        try {
          const resp = await api.get(`/websites/${currentUser.websiteId}`);
          setUserWebsiteName(resp.data?.name || null);
        } catch (e) {
          console.error('Failed to load user website', e);
        }
      } else {
        setUserWebsiteName(null);
      }
    };

    loadUserWebsite();
  }, [currentUser?.websiteName, currentUser?.websiteId, isAdmin]);

  /* ---------------------- Load options ----------------------- */
  // 1️⃣ Load websites and panels based on user restrictions
  useEffect(() => {
    if (hasLoadedOptions.current) return;
    const loadOptions = async () => {
      try {
        const params: any = {};
        if (!isAdmin && userWebsiteName) {
          params.website = userWebsiteName;
        }
        const resp = await api.get('/transactions/options', { params });
        let availableWebsites = resp.data.websites || [];
        if (!isAdmin && userWebsiteName) {
          availableWebsites = availableWebsites.filter(
            (w: string) => w === userWebsiteName
          );
        }
        let availablePanels = resp.data.panels || [];
        if (!isAdmin && currentUser?.panels && currentUser.panels.length > 0) {
          availablePanels = availablePanels.filter((p: string) =>
            currentUser.panels!.includes(p)
          );
        }
        setOptions({
          websites: availableWebsites,
          panels: availablePanels,
          branches: resp.data?.branches || []
        });
      } catch (e) {
        console.error('Failed to load options', e);
      }
    };
    loadOptions();
    hasLoadedOptions.current = true;
  }, [isAdmin, userWebsiteName, currentUser?.panels]);

  // Initialize website once when user restriction applies
  useEffect(() => {
    if (hasInitializedWebsite.current) return;
    if (!isAdmin && userWebsiteName && !website) {
      setWebsite(userWebsiteName);
      hasInitializedWebsite.current = true;
    }
  }, [isAdmin, userWebsiteName, website]);

  // 2️⃣ Load branches/panels whenever website or branch changes
  useEffect(() => {
    const targetKey = `${website || '__ALL__'}|${branch || '__ALL__'}`;
    if (targetKey === lastPanelsWebsite.current) return;
    const loadPanels = async () => {
      try {
        const params: any = {};
        if (website) {
          params.website = website;
        }
        if (branch) {
          params.branch = branch;
        }
        const resp = await api.get('/transactions/options', { params });
        let panels = resp.data?.panels || [];
        if (!isAdmin && currentUser?.panels && currentUser.panels.length > 0) {
          panels = panels.filter((p: string) =>
            currentUser.panels!.includes(p)
          );
        }
        const branchesResp = resp.data?.branches || [];
        setOptions(prev => ({ ...prev, panels, branches: branchesResp }));
        lastPanelsWebsite.current = targetKey;
      } catch (e) {
        console.error('Failed to load panels', e);
        setOptions(prev => ({ ...prev, panels: [], branches: [] }));
      }
    };
    loadPanels();
  }, [website, branch, isAdmin, currentUser?.panels]);

  // If user restrictions change, allow next website fetch to run again
  useEffect(() => {
    lastPanelsWebsite.current = null;
  }, [isAdmin, currentUser?.panels]);

  /* ---------------------- Fetch clients ---------------------- */
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: any = {
          page: page + 1, // API expects 1‑based page
          limit: rowsPerPage
        };

        if (appliedSearch) params.search = appliedSearch;
        if (appliedLastDepositDate)
          params.lastDepositDate = appliedLastDepositDate;
        if (appliedFirstDepositDate)
          params.firstDepositDate = appliedFirstDepositDate;
        if (appliedFirstTransactionDate)
          params.firstTransactionDate = appliedFirstTransactionDate;
        if (appliedLastTransactionDate)
          params.lastTransactionDate = appliedLastTransactionDate;
        if (appliedMinTotalDeposits !== '')
          params.minTotalDepositAmount = appliedMinTotalDeposits;
        if (appliedMaxTotalDeposits !== '')
          params.maxTotalDepositAmount = appliedMaxTotalDeposits;
        if (appliedFirstWithdrawalDate)
          params.firstWithdrawalDate = appliedFirstWithdrawalDate;
        if (appliedLastWithdrawalDate)
          params.lastWithdrawalDate = appliedLastWithdrawalDate;
        if (appliedMinTotalWithdrawals !== '')
          params.minTotalWithdrawalAmount = appliedMinTotalWithdrawals;
        if (appliedMaxTotalWithdrawals !== '')
          params.maxTotalWithdrawalAmount = appliedMaxTotalWithdrawals;
        if (appliedWebsite) params.website = appliedWebsite;
        if (appliedPanel) params.panel = appliedPanel;
        if (appliedBranch) params.branch = appliedBranch;
        if (appliedStatus) params.status = appliedStatus;
        if (appliedGameInterest) params.gameInterest = appliedGameInterest;
        if (appliedLastCallDate) params.lastCallDate = appliedLastCallDate;
        if (appliedLastCallOutcome) params.lastCallOutcome = appliedLastCallOutcome;

        const response = await api.get('/transactions/clients', { params });
        setClients(response.data.items);
        setTotal(response.data.total);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch clients');
      } finally {
        setLoading(false);
      }
    };

    // debounce search / filter changes (500 ms)
    const timeout = setTimeout(fetchClients, 500);
    return () => clearTimeout(timeout);
  }, [
    page,
    rowsPerPage,
    appliedSearch,
    appliedLastDepositDate,
    appliedFirstDepositDate,
    appliedFirstTransactionDate,
    appliedLastTransactionDate,
    appliedMinTotalDeposits,
    appliedMaxTotalDeposits,
    appliedFirstWithdrawalDate,
    appliedLastWithdrawalDate,
    appliedMinTotalWithdrawals,
    appliedMaxTotalWithdrawals,
    appliedWebsite,
    appliedPanel,
    appliedBranch,
    appliedStatus,
    appliedGameInterest,
    appliedLastCallDate,
    appliedLastCallOutcome
  ]);

  /* ------------------------ Handlers ------------------------ */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleLastDepositDateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLastDepositDate(e.target.value);
  };

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWebsite(e.target.value);
    setPanel(''); // reset panel when website changes
    setBranch(''); // reset branch when website changes
  };

  const handlePanelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPanel(e.target.value);
  };
  const handleBranchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBranch(e.target.value);
  };
  const handleFirstDepositDateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFirstDepositDate(e.target.value);
  };
  const handleFirstTransactionDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstTransactionDate(e.target.value);
  };
  const handleLastTransactionDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastTransactionDate(e.target.value);
  };
  const handleMinTotalDepositsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinTotalDeposits(e.target.value);
  };
  const handleMaxTotalDepositsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxTotalDeposits(e.target.value);
  };
  const handleFirstWithdrawalDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstWithdrawalDate(e.target.value);
  };
  const handleLastWithdrawalDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastWithdrawalDate(e.target.value);
  };
  const handleMinTotalWithdrawalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinTotalWithdrawals(e.target.value);
  };
  const handleMaxTotalWithdrawalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxTotalWithdrawals(e.target.value);
  };
  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatus(e.target.value);
  };
  const handleGameInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameInterest(e.target.value);
  };
  const handleLastCallDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastCallDate(e.target.value);
  };
  const handleLastCallOutcomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastCallOutcome(e.target.value);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleApplyFilters = () => {
    setAppliedSearch(search);
    setAppliedLastDepositDate(lastDepositDate);
    setAppliedFirstDepositDate(firstDepositDate);
    setAppliedWebsite(website);
    setAppliedPanel(panel);
    setAppliedBranch(branch);
    setPage(0);
    setAppliedMinTotalDeposits(minTotalDeposits);
    setAppliedMaxTotalDeposits(maxTotalDeposits);
    setAppliedFirstTransactionDate(firstTransactionDate);
    setAppliedLastTransactionDate(lastTransactionDate);
    setAppliedFirstWithdrawalDate(firstWithdrawalDate);
    setAppliedLastWithdrawalDate(lastWithdrawalDate);
    setAppliedMinTotalWithdrawals(minTotalWithdrawals);
    setAppliedMaxTotalWithdrawals(maxTotalWithdrawals);
    setAppliedStatus(status);
    setAppliedGameInterest(gameInterest);
    setAppliedLastCallDate(lastCallDate);
    setAppliedLastCallOutcome(lastCallOutcome);
  };

  const handleClearFilters = () => {
    const nextWebsite = !isAdmin && userWebsiteName ? userWebsiteName : '';
    setSearch('');
    setLastDepositDate('');
    setFirstDepositDate('');
    setFirstTransactionDate('');
    setLastTransactionDate('');
    setMinTotalDeposits('');
    setMaxTotalDeposits('');
    setFirstWithdrawalDate('');
    setLastWithdrawalDate('');
    setMinTotalWithdrawals('');
    setMaxTotalWithdrawals('');
    setStatus('');
    setGameInterest('');
    setLastCallDate('');
    setLastCallOutcome('');
    setWebsite(nextWebsite);
    setPanel('');
    setBranch('');
    setAppliedSearch('');
    setAppliedLastDepositDate('');
    setAppliedFirstDepositDate('');
    setAppliedFirstTransactionDate('');
    setAppliedLastTransactionDate('');
    setAppliedMinTotalDeposits('');
    setAppliedMaxTotalDeposits('');
    setAppliedFirstWithdrawalDate('');
    setAppliedLastWithdrawalDate('');
    setAppliedMinTotalWithdrawals('');
    setAppliedMaxTotalWithdrawals('');
    setAppliedStatus('');
    setAppliedGameInterest('');
    setAppliedLastCallDate('');
    setAppliedLastCallOutcome('');
    setAppliedWebsite(nextWebsite);
    setAppliedPanel('');
    setAppliedBranch('');
    setPage(0);
  };

  const handleContactClick = (
    e: React.MouseEvent,
    client: TransactionClient
  ) => {
    e.stopPropagation();
    setSelectedClient({ id: client.client, name: client.client });
    setContactDialogOpen(true);
  };

  const handleClientClick = (clientName: string) => {
    navigate(`/customers/transaction-client/${encodeURIComponent(clientName)}`);
  };

  /* -------------------------- UI --------------------------- */

  /* ---------------------- Render ---------------------- */
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Transaction Clients
      </Typography>
      <Paper sx={{ p: 1, mb: 2 }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 1, py: 0.5, cursor: 'pointer' }}
          onClick={() => setFiltersOpen(v => !v)}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Filters
          </Typography>
          <IconButton
            size="small"
            onClick={e => {
              e.stopPropagation();
              setFiltersOpen(v => !v);
            }}
          >
            {filtersOpen ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        <Collapse in={filtersOpen} unmountOnExit>
          <Box sx={{ pt: 1, px: 1, pb: 1 }}>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                <TextField
                  label="Search username, website, branch or panel"
                  fullWidth
                  value={search}
                  onChange={handleSearchChange}
                  size="small"
                />
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1, mt: 0.5, mb: 0.5 }}>
                  Portal
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  select
                  label="Website"
                  fullWidth
                  value={website}
                  onChange={handleWebsiteChange}
                  size="small"
                  disabled={!isAdmin && userWebsiteName !== null}
                  helperText={
                    !isAdmin && userWebsiteName
                      ? 'Restricted to your assigned website'
                      : ''
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  {options.websites.map(option => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  select
                  label="Branch"
                  fullWidth
                  value={branch}
                  onChange={handleBranchChange}
                  size="small"
                >
                  <MenuItem value="">All</MenuItem>
                  {options.branches.map(option => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  select
                  label="Panel"
                  fullWidth
                  value={panel}
                  onChange={handlePanelChange}
                  size="small"
                  disabled={
                    !isAdmin &&
                    currentUser?.panels &&
                    currentUser.panels.length > 0
                  }
                  helperText={
                    !isAdmin &&
                    currentUser?.panels &&
                    currentUser.panels.length > 0
                      ? 'Restricted to your assigned panels'
                      : ''
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  {options.panels.map(option => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1, mt: 0.5, mb: 0.5 }}>
                  Interactions
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="Last Call Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={lastCallDate}
                  onChange={handleLastCallDateChange}
                  onFocus={() => {
                    if (!lastCallDate) {
                      const d = new Date();
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      const today = `${yyyy}-${mm}-${dd}`;
                      setLastCallDate(today);
                    }
                  }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  select
                  label="Last Call Outcome"
                  fullWidth
                  value={lastCallOutcome}
                  onChange={handleLastCallOutcomeChange}
                  size="small"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="ringing">Ringing</MenuItem>
                  <MenuItem value="didnt_pick">Didn't Pick</MenuItem>
                  <MenuItem value="interested">Interested</MenuItem>
                  <MenuItem value="not_interested">Not Interested</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1, mt: 0.5, mb: 0.5 }}>
                  Transactions
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="First Transaction Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={firstTransactionDate}
                  onChange={handleFirstTransactionDateChange}
                  onFocus={() => {
                    if (!firstTransactionDate) {
                      const d = new Date();
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      const today = `${yyyy}-${mm}-${dd}`;
                      setFirstTransactionDate(today);
                    }
                  }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="Last Transaction Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={lastTransactionDate}
                  onChange={handleLastTransactionDateChange}
                  onFocus={() => {
                    if (!lastTransactionDate) {
                      const d = new Date();
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      const today = `${yyyy}-${mm}-${dd}`;
                      setLastTransactionDate(today);
                    }
                  }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1, mt: 0.5, mb: 0.5 }}>
                  Deposits
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="First Deposit Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={firstDepositDate}
                  onChange={handleFirstDepositDateChange}
                  onFocus={() => {
                    if (!firstDepositDate) {
                      const d = new Date();
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      const today = `${yyyy}-${mm}-${dd}`;
                      setFirstDepositDate(today);
                    }
                  }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="Last Deposit Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={lastDepositDate}
                  onChange={handleLastDepositDateChange}
                  onFocus={() => {
                    if (!lastDepositDate) {
                      const d = new Date();
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      const today = `${yyyy}-${mm}-${dd}`;
                      setLastDepositDate(today);
                    }
                  }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="Total Deposit Amount Min"
                  type="number"
                  fullWidth
                  value={minTotalDeposits}
                  onChange={handleMinTotalDepositsChange}
                  size="small"
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="Total Deposit Amount Max"
                  type="number"
                  fullWidth
                  value={maxTotalDeposits}
                  onChange={handleMaxTotalDepositsChange}
                  size="small"
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1, mt: 0.5, mb: 0.5 }}>
                  Withdrawals
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="First Withdrawal Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={firstWithdrawalDate}
                  onChange={handleFirstWithdrawalDateChange}
                  onFocus={() => {
                    if (!firstWithdrawalDate) {
                      const d = new Date();
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      const today = `${yyyy}-${mm}-${dd}`;
                      setFirstWithdrawalDate(today);
                    }
                  }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="Last Withdrawal Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={lastWithdrawalDate}
                  onChange={handleLastWithdrawalDateChange}
                  onFocus={() => {
                    if (!lastWithdrawalDate) {
                      const d = new Date();
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      const today = `${yyyy}-${mm}-${dd}`;
                      setLastWithdrawalDate(today);
                    }
                  }}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="Total Withdrawal Amount Min"
                  type="number"
                  fullWidth
                  value={minTotalWithdrawals}
                  onChange={handleMinTotalWithdrawalsChange}
                  size="small"
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="Total Withdrawal Amount Max"
                  type="number"
                  fullWidth
                  value={maxTotalWithdrawals}
                  onChange={handleMaxTotalWithdrawalsChange}
                  size="small"
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1, mt: 0.5, mb: 0.5 }}>
                  Miscellaneous
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  select
                  label="Status"
                  fullWidth
                  value={status}
                  onChange={handleStatusChange}
                  size="small"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="sleeping">Sleeping</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  select
                  label="Game Interest"
                  fullWidth
                  value={gameInterest}
                  onChange={handleGameInterestChange}
                  size="small"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="casino">Casino</MenuItem>
                  <MenuItem value="betting">Betting</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box display="flex" justifyContent="flex-end" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleApplyFilters}
                  >
                    Apply
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="transaction clients table">
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Panel</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Website</TableCell>
              <TableCell align="right">Total Deposits</TableCell>
              <TableCell>Last Deposit</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map(client => (
              <TableRow
                key={client.client}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => handleClientClick(client.client)}
              >
                <TableCell component="th" scope="row">
                  {client.client}
                </TableCell>
                <TableCell>{client.panel || client.branch || 'N/A'}</TableCell>
                <TableCell>
                  <Chip label={client.status} color="success" size="small" />
                </TableCell>
                <TableCell>{client.website}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`$${Number(client.totalDeposits).toFixed(2)}`}
                    color="success"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {client.lastDepositDate
                    ? new Date(client.lastDepositDate).toLocaleDateString()
                    : 'No deposits'}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="WhatsApp">
                    <IconButton
                      color="success"
                      size="small"
                      onClick={e => handleContactClick(e, client)}
                    >
                      <WhatsApp />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Call">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={e => handleContactClick(e, client)}
                    >
                      <Phone />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No clients found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Contact dialog – receives client id for future use */}
      <CommunicationDialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        customerId={selectedClient?.id || ''}
        customerName={selectedClient?.name || ''}
      />
    </Box>
  );
};

export default TransactionClientsPage;
