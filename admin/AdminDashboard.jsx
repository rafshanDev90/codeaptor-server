import React, { useState, useEffect, useRef, useMemo } from 'react';
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

const styles = {
  terminal: {
    background: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
    fontSize: '13px',
    lineHeight: '1.6',
    overflow: 'hidden',
  },
  terminalHeader: {
    background: '#161b22',
    borderBottom: '1px solid #30363d',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  terminalBody: {
    padding: '8px 0',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  logLine: {
    display: 'flex',
    padding: '0 16px',
    minHeight: '22px',
    alignItems: 'flex-start',
  },
  lineNumber: {
    color: '#484f58',
    minWidth: '32px',
    textAlign: 'right',
    paddingRight: '12px',
    userSelect: 'none',
    flexShrink: 0,
  },
};

const lineColor = (text) => {
  if (/✅/.test(text)) return '#3fb950';
  if (/❌/.test(text)) return '#f85149';
  if (/⚠/.test(text)) return '#d29922';
  if (/FATAL|error|Error/.test(text)) return '#f85149';
  if (/🔍|📦|🐙|🤖|📊|🎯|🖼/.test(text)) return '#58a6ff';
  if (/→/.test(text)) return '#8b949e';
  if (/##SUMMARY##/.test(text)) return '#d2a8ff';
  return '#c9d1d9';
};

const LogEntry = ({ index, text }) => {
  const color = useMemo(() => lineColor(text), [text]);

  let prefix = null;
  if (/^✅/.test(text)) prefix = { char: '✓', label: 'success', color: '#3fb950' };
  else if (/^❌/.test(text)) prefix = { char: '✗', label: 'error', color: '#f85149' };
  else if (/^⚠/.test(text)) prefix = { char: '!', label: 'warn', color: '#d29922' };

  return (
    <div
      style={{
        ...styles.logLine,
        background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
      }}
    >
      <span style={styles.lineNumber}>{index + 1}</span>
      <span style={{ color, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {text}
      </span>
    </div>
  );
};

const LogViewer = ({ logs, syncing, running }) => {
  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const elapsed = useMemo(() => {
    if (!syncing) return null;
    const seconds = Math.floor((Date.now() - window._syncStart) / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [logs, syncing]);

  return (
    <Box mt="lg">
      <H4 mb="lg" style={{ color: '#e6edf3' }}>Pipeline Logs</H4>
      <Box style={styles.terminal}>
        <Box style={styles.terminalHeader}>
          <Box flex alignItems="center" gap="md">
            <Badge variant={syncing ? 'primary' : running ? 'primary' : 'default'}>
              {syncing ? 'RUNNING' : running ? 'RUNNING' : 'COMPLETED'}
            </Badge>
            {syncing && (
              <Text style={{ color: '#8b949e', fontSize: '12px' }}>
                Elapsed: {elapsed || '0:00'}
              </Text>
            )}
          </Box>
          <Text style={{ color: '#8b949e', fontSize: '12px' }}>
            {logs.length} line{logs.length !== 1 ? 's' : ''}
          </Text>
        </Box>
        <Box style={styles.terminalBody}>
          {logs.length === 0 && syncing && (
            <div style={{ ...styles.logLine, color: '#484f58' }}>
              <span style={styles.lineNumber}>1</span>
              <span>Waiting for output...</span>
            </div>
          )}
          {logs.map((entry, i) => (
            <LogEntry key={i} index={i} text={entry} />
          ))}
          <div ref={endRef} />
        </Box>
      </Box>
    </Box>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stopping, setStopping] = useState(false);

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

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncSuccess(null);
    setLogs([]);
    setStopping(false);
    window._syncStart = Date.now();

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

  const handleStop = async () => {
    setStopping(true);
    try {
      const res = await fetch('/admin/api/discovery/stop');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to stop');
    } catch (err) {
      setSyncError(err.message);
    } finally {
      setStopping(false);
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
          {lastRun && !syncing && !isRunning ? (
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

          {!lastRun && !syncing && !isRunning ? (
            <Text mb="lg" color="grey60">No discovery runs yet.</Text>
          ) : null}

          {syncError && <Box mb="md"><Text color="danger">{syncError}</Text></Box>}
          {syncSuccess && <Box mb="md"><Text color="success">{syncSuccess}</Text></Box>}

          <Box flex gap="md" alignItems="center">
            <Button
              variant="primary"
              onClick={handleSync}
              disabled={syncing || isRunning}
            >
              {syncing ? 'Syncing...' : isRunning ? 'Sync in progress...' : 'Sync Now'}
            </Button>
            {(syncing || isRunning) && (
              <Button
                variant="danger"
                onClick={handleStop}
                disabled={stopping}
              >
                {stopping ? 'Stopping...' : 'Stop Sync'}
              </Button>
            )}
          </Box>

          {(syncing || isRunning || logs.length > 0) && (
            <LogViewer logs={logs} syncing={syncing} running={isRunning} />
          )}
        </Box>
      </Box>

      {history.length > 0 && !syncing && !isRunning && (
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