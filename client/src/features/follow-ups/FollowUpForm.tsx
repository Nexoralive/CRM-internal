import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Pagination
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import api from '../../utils/axios';
import { isAxiosError } from 'axios';

interface FollowUpFormProps {
  customerId: string;
  onSuccess?: () => void;
}

interface FollowUpItem {
  id: string;
  date: string;
  content: string;
  status: 'pending' | 'completed' | 'cancelled';
}

function formatTwoDigits(value: number): string {
  return value.toString().padStart(2, '0');
}

function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = formatTwoDigits(now.getMonth() + 1);
  const d = formatTwoDigits(now.getDate());
  return `${y}-${m}-${d}`;
}

function getNowTimeString(): string {
  const now = new Date();
  const hh = formatTwoDigits(now.getHours());
  const mm = formatTwoDigits(now.getMinutes());
  return `${hh}:${mm}`;
}

function buildLocalDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  // Date uses local timezone when provided as discrete parts
  return new Date(
    year,
    (month || 1) - 1,
    day || 1,
    hour || 0,
    minute || 0,
    0,
    0
  );
}

export default function FollowUpForm({
  customerId,
  onSuccess
}: FollowUpFormProps) {
  const [date, setDate] = useState<string>(getTodayDateString());
  const [time, setTime] = useState<string>(''); // no default time to avoid initial error state
  const [content, setContent] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [dateTouched, setDateTouched] = useState(false);
  const [timeTouched, setTimeTouched] = useState(false);
  const [contentTouched, setContentTouched] = useState(false);

  const [listLoading, setListLoading] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionAnchorEl, setActionAnchorEl] = useState<HTMLElement | null>(
    null
  );
  const [actionForId, setActionForId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const limit = 5;

  const minDate = useMemo(() => getTodayDateString(), []);
  const minTime = useMemo(() => {
    // Only enforce min time for the selected date when it's today
    return date === getTodayDateString() ? getNowTimeString() : '00:00';
  }, [date]);

  function formatReadableDateTime(isoString: string): string {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  }

  const { dateError, timeError, contentError } = useMemo(() => {
    let dateErrorMsg: string | null = null;
    let timeErrorMsg: string | null = null;
    let contentErrorMsg: string | null = null;

    if (!date) {
      dateErrorMsg = 'Date is required';
    }
    if (!time) {
      timeErrorMsg = 'Time is required';
    }
    if (!content.trim()) {
      contentErrorMsg = 'Note is required';
    }

    if (!dateErrorMsg && !timeErrorMsg) {
      const selected = buildLocalDate(date, time);
      const now = new Date();
      if (selected.getTime() < now.getTime()) {
        // Show the error on the most relevant field(s)
        dateErrorMsg = 'Date/time cannot be in the past';
        timeErrorMsg = 'Date/time cannot be in the past';
      }
    }
    return {
      dateError: dateErrorMsg,
      timeError: timeErrorMsg,
      contentError: contentErrorMsg
    };
  }, [date, time, content]);

  const hasErrors = Boolean(dateError || timeError || contentError);
  const showDateError = Boolean(dateError && (dateTouched || submitAttempted));
  const showTimeError = Boolean(timeError && (timeTouched || submitAttempted));
  const showContentError = Boolean(
    contentError && (contentTouched || submitAttempted)
  );

  const fetchFollowUps = async (overridePage?: number) => {
    if (!customerId) return;
    try {
      setListLoading(true);
      setListError(null);
      const currentPage = overridePage ?? page;
      const res = await api.get(
        `/customers/follow-ups/${encodeURIComponent(customerId)}`,
        {
          params: { page: currentPage, limit }
        }
      );
      const items = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      const pages =
        typeof res.data?.totalPages === 'number' ? res.data.totalPages : 1;
      setFollowUps(items);
      setTotalPages(pages);
    } catch (err: unknown) {
      const message =
        isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : 'Failed to load follow-ups';
      setListError(message);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setError(null);
    setSuccess(null);
    if (hasErrors || !customerId) return;

    try {
      setSubmitting(true);
      const when = buildLocalDate(date, time);
      await api.post(
        `/customers/follow-ups/${encodeURIComponent(customerId)}`,
        {
          content: content.trim(),
          date: when.toISOString()
        }
      );
      setSuccess('Follow-up scheduled successfully.');
      setContent('');
      setTime('');
      setDateTouched(false);
      setTimeTouched(false);
      setContentTouched(false);
      setSubmitAttempted(false);
      setPage(1);
      fetchFollowUps(1);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const message =
        isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : 'Failed to create follow-up';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (
    id: string,
    status: 'completed' | 'cancelled'
  ) => {
    try {
      setUpdatingId(id);
      await api.patch(`/customers/follow-ups/${encodeURIComponent(id)}`, {
        status
      });
      await fetchFollowUps();
    } catch (err: unknown) {
      // surface as list error
      const message =
        isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : 'Failed to update follow-up';
      setListError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenActions = (id: string, el: HTMLElement) => {
    setActionForId(id);
    setActionAnchorEl(el);
  };
  const handleCloseActions = () => {
    setActionForId(null);
    setActionAnchorEl(null);
  };
  const handleAction = async (status: 'completed' | 'cancelled') => {
    if (!actionForId) return;
    await updateStatus(actionForId, status);
    handleCloseActions();
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="subtitle1" gutterBottom>
        Create Follow-up
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          onBlur={() => setDateTouched(true)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: minDate }}
          error={showDateError}
          helperText={showDateError ? dateError : ' '}
          sx={{ minWidth: 200 }}
          required
        />
        <TextField
          label="Time"
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          onBlur={() => setTimeTouched(true)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: minTime }}
          error={showTimeError}
          helperText={showTimeError ? timeError : ' '}
          sx={{ minWidth: 160 }}
          required
        />
      </Box>

      <Box sx={{ position: 'relative' }}>
        <TextField
          label="Note"
          multiline
          minRows={3}
          fullWidth
          value={content}
          onChange={e => setContent(e.target.value)}
          onBlur={() => setContentTouched(true)}
          error={showContentError}
          helperText={showContentError ? contentError : ' '}
          inputProps={{ maxLength: 128 }}
          required
        />
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            color: 'text.secondary'
          }}
        >
          {content.length}/128
        </Typography>
      </Box>

      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          type="submit"
          variant="contained"
          disabled={submitting || hasErrors || !customerId}
        >
          {submitting ? 'Submitting...' : 'Create Follow-up'}
        </Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" gutterBottom>
        Existing Follow-ups
      </Typography>
      {listError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {listError}
        </Alert>
      )}
      {listLoading ? (
        <Typography color="text.secondary">Loading...</Typography>
      ) : followUps.length === 0 ? (
        <Typography color="text.secondary">No follow-ups found.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {followUps.map(f => (
            <Box
              key={f.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatReadableDateTime(f.date)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {f.content}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Chip
                  size="small"
                  label={f.status}
                  color={
                    f.status === 'pending'
                      ? 'warning'
                      : f.status === 'completed'
                      ? 'success'
                      : 'default'
                  }
                />
                {f.status === 'pending' && (
                  <>
                    <IconButton
                      aria-label="actions"
                      onClick={e => handleOpenActions(f.id, e.currentTarget)}
                      disabled={updatingId === f.id}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>
          ))}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => {
                  setPage(value);
                  fetchFollowUps(value);
                }}
                size="small"
              />
            </Box>
          )}
          <Menu
            anchorEl={actionAnchorEl}
            open={Boolean(actionAnchorEl)}
            onClose={handleCloseActions}
          >
            <MenuItem
              onClick={() => handleAction('completed')}
              disabled={updatingId === actionForId}
            >
              Mark Done
            </MenuItem>
            <MenuItem
              onClick={() => handleAction('cancelled')}
              disabled={updatingId === actionForId}
            >
              Cancel
            </MenuItem>
          </Menu>
        </Box>
      )}
    </Box>
  );
}
