import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, Button, Loader, Badge, Table, TableHead, TableBody, TableCell, TableRow, Icon, H2, H4 } from '@adminjs/design-system';

const StatCard = ({ label, value, icon }) => (
  <Box variant="card" p="xl" flex alignItems="center" gap="lg" flexBasis="220px" flexGrow={1}>
    <Icon icon={icon} size={32} color="primary100" />
    <Box>
      <Text variant="sm" color="grey80">{label}</Text>
      <Text variant="xxl" fontWeight="bold" mt="default">{value}</Text>
    </Box>
  </Box>
);

const statusVariant = (status) => {
  switch (status) {
    case 'completed': return 'success';
    case 'running': return 'primary';
    case 'failed': return 'danger';
    default: return 'default';
  }
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/admin/api/dashboard');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('AdminDashboard: failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/admin/api/discovery/history');
      if (!res.ok) return;
      const data = await res.json();
      if (data.history) setHistory(data.history);
    } catch (err) {
      /* non-critical */
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncSuccess(null);
    setLogs([]);

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/admin/api/discovery/logs');
        if (res.ok) {
          const data = await res.json();
          if (data.logs) setLogs(data.logs);
        }
      } catch (_) {}
    }, 2000);

    try {
      const res = await fetch('/admin/api/discovery/start');
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Sync failed');
      setSyncSuccess('Discovery sync completed successfully!');
      await Promise.all([fetchDashboard(), fetchHistory()]);
    } catch (err) {
      setSyncError(err.message);
    } finally {
      clearInterval(pollInterval);
      setSyncing(false);
      try {
        const res = await fetch('/admin/api/discovery/logs');
        if (res.ok) {
          const data = await res.json();
          if (data.logs) setLogs(data.logs);
        }
      } catch (_) {}
    }
  };

  if (loading) {
    return (
      <Box p="xxl" flex justifyContent="center" alignItems="center">
        <Loader />
      </Box>
    );
  }

  const isRunning = stats?.discovery?.isRunning;
  const lastRun = stats?.discovery?.lastRun;

  return (
    <Box p="xl">
      <Box mb="xl">
        <H2>Dashboard</H2>
        <Text color="grey80">Overview of CLI Hub system</Text>
      </Box>

      <Box flex flexWrap="wrap" gap="lg" mb="xxl">
        <StatCard label="Total Tools" value={stats?.totalTools ?? 0} icon="Terminal" />
        <StatCard label="Active Tools" value={stats?.activeTools ?? 0} icon="Check" />
        <StatCard label="Users" value={stats?.totalUsers ?? 0} icon="User" />
        <StatCard label="Categories" value={stats?.totalCategories ?? 0} icon="Folder" />
      </Box>

      <Box mb="xxl">
        <H4 mb="lg">Discovery Sync</H4>
        <Box variant="card" p="xl">
          {lastRun && !syncing ? (
            <Box mb="lg">
              <Text fontWeight="bold">Last Run:</Text>
              <Box mt="sm" flex alignItems="center" gap="md">
                <Badge variant={statusVariant(lastRun.status)}>{lastRun.status}</Badge>
                <Text as="span" fontSize="sm">{new Date(lastRun.startedAt).toLocaleString()}</Text>
              </Box>
              <Box mt="md" flex gap="xxl">
                <Text fontSize="sm">Duration: {lastRun.duration}ms</Text>
                <Text fontSize="sm">Candidates: {lastRun.candidates}</Text>
                <Text fontSize="sm">Inserted: {lastRun.inserted}</Text>
                <Text fontSize="sm">Errors: {lastRun.errors}</Text>
              </Box>
            </Box>
          ) : null}

          {!lastRun && !syncing ? (
            <Text mb="lg" color="grey60">No discovery runs yet.</Text>
          ) : null}

          {syncError && <Box mb="md"><Text color="danger">{syncError}</Text></Box>}
          {syncSuccess && <Box mb="md"><Text color="success">{syncSuccess}</Text></Box>}

          <Button
            variant="primary"
            onClick={handleSync}
            disabled={syncing || isRunning}
          >
            {syncing ? 'Syncing...' : isRunning ? 'Sync in progress...' : 'Sync Now'}
          </Button>

          {(syncing || logs.length > 0) && (
            <Box mt="lg">
              <Text fontWeight="bold" mb="sm">Pipeline Logs:</Text>
              <Box
                variant="container"
                bg="grey100"
                p="md"
                style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  borderRadius: '4px',
                }}
              >
                {logs.length === 0 && syncing && <Text color="grey60">Waiting for output...</Text>}
                {logs.map((entry, i) => (
                  <Text key={i} as="div" fontSize="sm">{entry}</Text>
                ))}
                <div ref={logsEndRef} />
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {history.length > 0 && !syncing && (
        <Box>
          <H4 mb="lg">Sync History (Last {history.length})</H4>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><Text fontWeight="bold">Started</Text></TableCell>
                <TableCell><Text fontWeight="bold">Status</Text></TableCell>
                <TableCell><Text fontWeight="bold">Candidates</Text></TableCell>
                <TableCell><Text fontWeight="bold">Inserted</Text></TableCell>
                <TableCell><Text fontWeight="bold">Errors</Text></TableCell>
                <TableCell><Text fontWeight="bold">Duration</Text></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map(run => (
                <TableRow key={run._id}>
                  <TableCell>{new Date(run.startedAt).toLocaleString()}</TableCell>
                  <TableCell><Badge variant={statusVariant(run.status)}>{run.status}</Badge></TableCell>
                  <TableCell>{run.candidates ?? 0}</TableCell>
                  <TableCell>{run.inserted ?? 0}</TableCell>
                  <TableCell>{run.errors ?? 0}</TableCell>
                  <TableCell>{run.duration ? `${run.duration}ms` : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default AdminDashboard;