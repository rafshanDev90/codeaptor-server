(function (React, designSystem) {
  'use strict';

  function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

  var React__default = /*#__PURE__*/_interopDefault(React);

  const StatCard = ({
    label,
    value,
    icon
  }) => /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
    variant: "card",
    p: "xl",
    flex: true,
    alignItems: "center",
    gap: "lg",
    flexBasis: "220px",
    flexGrow: 1
  }, /*#__PURE__*/React__default.default.createElement(designSystem.Icon, {
    icon: icon,
    size: 32,
    color: "primary100"
  }), /*#__PURE__*/React__default.default.createElement(designSystem.Box, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
    variant: "sm",
    color: "grey80"
  }, label), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
    variant: "xxl",
    fontWeight: "bold",
    mt: "default"
  }, value)));
  const statusVariant = status => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'primary';
      case 'failed':
        return 'danger';
      default:
        return 'default';
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
      overflow: 'hidden'
    },
    terminalHeader: {
      background: '#161b22',
      borderBottom: '1px solid #30363d',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    terminalBody: {
      padding: '8px 0',
      maxHeight: '400px',
      overflowY: 'auto'
    },
    logLine: {
      display: 'flex',
      padding: '0 16px',
      minHeight: '22px',
      alignItems: 'flex-start'
    },
    lineNumber: {
      color: '#484f58',
      minWidth: '32px',
      textAlign: 'right',
      paddingRight: '12px',
      userSelect: 'none',
      flexShrink: 0
    }
  };
  const lineColor = text => {
    if (/✅/.test(text)) return '#3fb950';
    if (/❌/.test(text)) return '#f85149';
    if (/⚠/.test(text)) return '#d29922';
    if (/FATAL|error|Error/.test(text)) return '#f85149';
    if (/🔍|📦|🐙|🤖|📊|🎯|🖼/.test(text)) return '#58a6ff';
    if (/→/.test(text)) return '#8b949e';
    if (/##SUMMARY##/.test(text)) return '#d2a8ff';
    return '#c9d1d9';
  };
  const LogEntry = ({
    index,
    text
  }) => {
    const color = React.useMemo(() => lineColor(text), [text]);
    return /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        ...styles.logLine,
        background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'
      }
    }, /*#__PURE__*/React__default.default.createElement("span", {
      style: styles.lineNumber
    }, index + 1), /*#__PURE__*/React__default.default.createElement("span", {
      style: {
        color,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }
    }, text));
  };
  const LogViewer = ({
    logs,
    syncing,
    running
  }) => {
    const endRef = React.useRef(null);
    React.useEffect(() => {
      if (endRef.current) {
        endRef.current.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }, [logs]);
    const elapsed = React.useMemo(() => {
      if (!syncing) return null;
      const seconds = Math.floor((Date.now() - window._syncStart) / 1000);
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }, [logs, syncing]);
    return /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
      mt: "lg"
    }, /*#__PURE__*/React__default.default.createElement(designSystem.H4, {
      mb: "lg",
      style: {
        color: '#e6edf3'
      }
    }, "Pipeline Logs"), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
      style: styles.terminal
    }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
      style: styles.terminalHeader
    }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
      flex: true,
      alignItems: "center",
      gap: "md"
    }, /*#__PURE__*/React__default.default.createElement(designSystem.Badge, {
      variant: syncing ? 'primary' : running ? 'primary' : 'default'
    }, syncing ? 'RUNNING' : running ? 'RUNNING' : 'COMPLETED'), syncing && /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      style: {
        color: '#8b949e',
        fontSize: '12px'
      }
    }, "Elapsed: ", elapsed || '0:00')), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      style: {
        color: '#8b949e',
        fontSize: '12px'
      }
    }, logs.length, " line", logs.length !== 1 ? 's' : '')), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
      style: styles.terminalBody
    }, logs.length === 0 && syncing && /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        ...styles.logLine,
        color: '#484f58'
      }
    }, /*#__PURE__*/React__default.default.createElement("span", {
      style: styles.lineNumber
    }, "1"), /*#__PURE__*/React__default.default.createElement("span", null, "Waiting for output...")), logs.map((entry, i) => /*#__PURE__*/React__default.default.createElement(LogEntry, {
      key: i,
      index: i,
      text: entry
    })), /*#__PURE__*/React__default.default.createElement("div", {
      ref: endRef
    }))));
  };
  const AdminDashboard = () => {
    const [stats, setStats] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [syncing, setSyncing] = React.useState(false);
    const [syncError, setSyncError] = React.useState(null);
    const [syncSuccess, setSyncSuccess] = React.useState(null);
    const [history, setHistory] = React.useState([]);
    const [logs, setLogs] = React.useState([]);
    const [stopping, setStopping] = React.useState(false);
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
    React.useEffect(() => {
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
      return /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        p: "xxl",
        flex: true,
        justifyContent: "center",
        alignItems: "center"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Loader, null));
    }
    const isRunning = stats?.discovery?.isRunning;
    const lastRun = stats?.discovery?.lastRun;
    return /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
      p: "xl"
    }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
      mb: "xl"
    }, /*#__PURE__*/React__default.default.createElement(designSystem.H2, null, "Dashboard"), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      color: "grey80"
    }, "Overview of CLI Hub system")), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
      flex: true,
      flexWrap: "wrap",
      gap: "lg",
      mb: "xxl"
    }, /*#__PURE__*/React__default.default.createElement(StatCard, {
      label: "Total Tools",
      value: stats?.totalTools ?? 0,
      icon: "Terminal"
    }), /*#__PURE__*/React__default.default.createElement(StatCard, {
      label: "Active Tools",
      value: stats?.activeTools ?? 0,
      icon: "Check"
    }), /*#__PURE__*/React__default.default.createElement(StatCard, {
      label: "Users",
      value: stats?.totalUsers ?? 0,
      icon: "User"
    }), /*#__PURE__*/React__default.default.createElement(StatCard, {
      label: "Categories",
      value: stats?.totalCategories ?? 0,
      icon: "Folder"
    })), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
      mb: "xxl"
    }, /*#__PURE__*/React__default.default.createElement(designSystem.H4, {
      mb: "lg"
    }, "Discovery Sync"), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
      variant: "card",
      p: "xl"
    }, lastRun && !syncing && !isRunning ? /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
      mb: "lg"
    }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      fontWeight: "bold"
    }, "Last Run:"), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
      mt: "sm",
      flex: true,
      alignItems: "center",
      gap: "md"
    }, /*#__PURE__*/React__default.default.createElement(designSystem.Badge, {
      variant: statusVariant(lastRun.status)
    }, lastRun.status), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      as: "span",
      fontSize: "sm"
    }, new Date(lastRun.startedAt).toLocaleString())), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
      mt: "md",
      flex: true,
      gap: "xxl"
    }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      fontSize: "sm"
    }, "Duration: ", lastRun.duration, "ms"), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      fontSize: "sm"
    }, "Candidates: ", lastRun.candidates), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      fontSize: "sm"
    }, "Inserted: ", lastRun.inserted), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      fontSize: "sm"
    }, "Errors: ", lastRun.errors))) : null, !lastRun && !syncing && !isRunning ? /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      mb: "lg",
      color: "grey60"
    }, "No discovery runs yet.") : null, syncError && /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
      mb: "md"
    }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      color: "danger"
    }, syncError)), syncSuccess && /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
      mb: "md"
    }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      color: "success"
    }, syncSuccess)), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
      flex: true,
      gap: "md",
      alignItems: "center"
    }, /*#__PURE__*/React__default.default.createElement(designSystem.Button, {
      variant: "primary",
      onClick: handleSync,
      disabled: syncing || isRunning
    }, syncing ? 'Syncing...' : isRunning ? 'Sync in progress...' : 'Sync Now'), (syncing || isRunning) && /*#__PURE__*/React__default.default.createElement(designSystem.Button, {
      variant: "danger",
      onClick: handleStop,
      disabled: stopping
    }, stopping ? 'Stopping...' : 'Stop Sync')), (syncing || isRunning || logs.length > 0) && /*#__PURE__*/React__default.default.createElement(LogViewer, {
      logs: logs,
      syncing: syncing,
      running: isRunning
    }))), history.length > 0 && !syncing && !isRunning && /*#__PURE__*/React__default.default.createElement(designSystem.Box, null, /*#__PURE__*/React__default.default.createElement(designSystem.H4, {
      mb: "lg"
    }, "Sync History (Last ", history.length, ")"), /*#__PURE__*/React__default.default.createElement(designSystem.Table, null, /*#__PURE__*/React__default.default.createElement(designSystem.TableHead, null, /*#__PURE__*/React__default.default.createElement(designSystem.TableRow, null, /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      fontWeight: "bold"
    }, "Started")), /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      fontWeight: "bold"
    }, "Status")), /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      fontWeight: "bold"
    }, "Candidates")), /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      fontWeight: "bold"
    }, "Inserted")), /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      fontWeight: "bold"
    }, "Errors")), /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
      fontWeight: "bold"
    }, "Duration")))), /*#__PURE__*/React__default.default.createElement(designSystem.TableBody, null, history.map(run => /*#__PURE__*/React__default.default.createElement(designSystem.TableRow, {
      key: run._id
    }, /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, null, new Date(run.startedAt).toLocaleString()), /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, null, /*#__PURE__*/React__default.default.createElement(designSystem.Badge, {
      variant: statusVariant(run.status)
    }, run.status)), /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, null, run.candidates ?? 0), /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, null, run.inserted ?? 0), /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, null, run.errors ?? 0), /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, null, run.duration ? `${run.duration}ms` : '-')))))));
  };

  AdminJS.UserComponents = {};
  AdminJS.UserComponents.AdminDashboard = AdminDashboard;

})(React, AdminJSDesignSystem);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9hZG1pbi9BZG1pbkRhc2hib2FyZC5qc3giLCJlbnRyeS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUsIHVzZUVmZmVjdCwgdXNlUmVmLCB1c2VNZW1vIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgQm94LCBUZXh0LCBCdXR0b24sIExvYWRlciwgQmFkZ2UsIFRhYmxlLCBUYWJsZUhlYWQsIFRhYmxlQm9keSwgVGFibGVDZWxsLCBUYWJsZVJvdywgSWNvbiwgSDIsIEg0IH0gZnJvbSAnQGFkbWluanMvZGVzaWduLXN5c3RlbSc7XG5cbmNvbnN0IFN0YXRDYXJkID0gKHsgbGFiZWwsIHZhbHVlLCBpY29uIH0pID0+IChcbiAgPEJveCB2YXJpYW50PVwiY2FyZFwiIHA9XCJ4bFwiIGZsZXggYWxpZ25JdGVtcz1cImNlbnRlclwiIGdhcD1cImxnXCIgZmxleEJhc2lzPVwiMjIwcHhcIiBmbGV4R3Jvdz17MX0+XG4gICAgPEljb24gaWNvbj17aWNvbn0gc2l6ZT17MzJ9IGNvbG9yPVwicHJpbWFyeTEwMFwiIC8+XG4gICAgPEJveD5cbiAgICAgIDxUZXh0IHZhcmlhbnQ9XCJzbVwiIGNvbG9yPVwiZ3JleTgwXCI+e2xhYmVsfTwvVGV4dD5cbiAgICAgIDxUZXh0IHZhcmlhbnQ9XCJ4eGxcIiBmb250V2VpZ2h0PVwiYm9sZFwiIG10PVwiZGVmYXVsdFwiPnt2YWx1ZX08L1RleHQ+XG4gICAgPC9Cb3g+XG4gIDwvQm94PlxuKTtcblxuY29uc3Qgc3RhdHVzVmFyaWFudCA9IChzdGF0dXMpID0+IHtcbiAgc3dpdGNoIChzdGF0dXMpIHtcbiAgICBjYXNlICdjb21wbGV0ZWQnOiByZXR1cm4gJ3N1Y2Nlc3MnO1xuICAgIGNhc2UgJ3J1bm5pbmcnOiByZXR1cm4gJ3ByaW1hcnknO1xuICAgIGNhc2UgJ2ZhaWxlZCc6IHJldHVybiAnZGFuZ2VyJztcbiAgICBkZWZhdWx0OiByZXR1cm4gJ2RlZmF1bHQnO1xuICB9XG59O1xuXG5jb25zdCBzdHlsZXMgPSB7XG4gIHRlcm1pbmFsOiB7XG4gICAgYmFja2dyb3VuZDogJyMwZDExMTcnLFxuICAgIGJvcmRlcjogJzFweCBzb2xpZCAjMzAzNjNkJyxcbiAgICBib3JkZXJSYWRpdXM6ICc2cHgnLFxuICAgIGZvbnRGYW1pbHk6IFwiJ1NGIE1vbm8nLCAnRmlyYSBDb2RlJywgJ0NvbnNvbGFzJywgbW9ub3NwYWNlXCIsXG4gICAgZm9udFNpemU6ICcxM3B4JyxcbiAgICBsaW5lSGVpZ2h0OiAnMS42JyxcbiAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gIH0sXG4gIHRlcm1pbmFsSGVhZGVyOiB7XG4gICAgYmFja2dyb3VuZDogJyMxNjFiMjInLFxuICAgIGJvcmRlckJvdHRvbTogJzFweCBzb2xpZCAjMzAzNjNkJyxcbiAgICBwYWRkaW5nOiAnOHB4IDE2cHgnLFxuICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcbiAgICBqdXN0aWZ5Q29udGVudDogJ3NwYWNlLWJldHdlZW4nLFxuICB9LFxuICB0ZXJtaW5hbEJvZHk6IHtcbiAgICBwYWRkaW5nOiAnOHB4IDAnLFxuICAgIG1heEhlaWdodDogJzQwMHB4JyxcbiAgICBvdmVyZmxvd1k6ICdhdXRvJyxcbiAgfSxcbiAgbG9nTGluZToge1xuICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICBwYWRkaW5nOiAnMCAxNnB4JyxcbiAgICBtaW5IZWlnaHQ6ICcyMnB4JyxcbiAgICBhbGlnbkl0ZW1zOiAnZmxleC1zdGFydCcsXG4gIH0sXG4gIGxpbmVOdW1iZXI6IHtcbiAgICBjb2xvcjogJyM0ODRmNTgnLFxuICAgIG1pbldpZHRoOiAnMzJweCcsXG4gICAgdGV4dEFsaWduOiAncmlnaHQnLFxuICAgIHBhZGRpbmdSaWdodDogJzEycHgnLFxuICAgIHVzZXJTZWxlY3Q6ICdub25lJyxcbiAgICBmbGV4U2hyaW5rOiAwLFxuICB9LFxufTtcblxuY29uc3QgbGluZUNvbG9yID0gKHRleHQpID0+IHtcbiAgaWYgKC/inIUvLnRlc3QodGV4dCkpIHJldHVybiAnIzNmYjk1MCc7XG4gIGlmICgv4p2MLy50ZXN0KHRleHQpKSByZXR1cm4gJyNmODUxNDknO1xuICBpZiAoL+KaoC8udGVzdCh0ZXh0KSkgcmV0dXJuICcjZDI5OTIyJztcbiAgaWYgKC9GQVRBTHxlcnJvcnxFcnJvci8udGVzdCh0ZXh0KSkgcmV0dXJuICcjZjg1MTQ5JztcbiAgaWYgKC/wn5SNfPCfk6Z88J+QmXzwn6SWfPCfk4p88J+Or3zwn5a8Ly50ZXN0KHRleHQpKSByZXR1cm4gJyM1OGE2ZmYnO1xuICBpZiAoL+KGki8udGVzdCh0ZXh0KSkgcmV0dXJuICcjOGI5NDllJztcbiAgaWYgKC8jI1NVTU1BUlkjIy8udGVzdCh0ZXh0KSkgcmV0dXJuICcjZDJhOGZmJztcbiAgcmV0dXJuICcjYzlkMWQ5Jztcbn07XG5cbmNvbnN0IExvZ0VudHJ5ID0gKHsgaW5kZXgsIHRleHQgfSkgPT4ge1xuICBjb25zdCBjb2xvciA9IHVzZU1lbW8oKCkgPT4gbGluZUNvbG9yKHRleHQpLCBbdGV4dF0pO1xuXG4gIGxldCBwcmVmaXggPSBudWxsO1xuICBpZiAoL17inIUvLnRlc3QodGV4dCkpIHByZWZpeCA9IHsgY2hhcjogJ+KckycsIGxhYmVsOiAnc3VjY2VzcycsIGNvbG9yOiAnIzNmYjk1MCcgfTtcbiAgZWxzZSBpZiAoL17inYwvLnRlc3QodGV4dCkpIHByZWZpeCA9IHsgY2hhcjogJ+KclycsIGxhYmVsOiAnZXJyb3InLCBjb2xvcjogJyNmODUxNDknIH07XG4gIGVsc2UgaWYgKC9e4pqgLy50ZXN0KHRleHQpKSBwcmVmaXggPSB7IGNoYXI6ICchJywgbGFiZWw6ICd3YXJuJywgY29sb3I6ICcjZDI5OTIyJyB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgc3R5bGU9e3tcbiAgICAgICAgLi4uc3R5bGVzLmxvZ0xpbmUsXG4gICAgICAgIGJhY2tncm91bmQ6IGluZGV4ICUgMiA9PT0gMCA/ICd0cmFuc3BhcmVudCcgOiAncmdiYSgyNTUsMjU1LDI1NSwwLjAxNSknLFxuICAgICAgfX1cbiAgICA+XG4gICAgICA8c3BhbiBzdHlsZT17c3R5bGVzLmxpbmVOdW1iZXJ9PntpbmRleCArIDF9PC9zcGFuPlxuICAgICAgPHNwYW4gc3R5bGU9e3sgY29sb3IsIHdoaXRlU3BhY2U6ICdwcmUtd3JhcCcsIHdvcmRCcmVhazogJ2JyZWFrLXdvcmQnIH19PlxuICAgICAgICB7dGV4dH1cbiAgICAgIDwvc3Bhbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IExvZ1ZpZXdlciA9ICh7IGxvZ3MsIHN5bmNpbmcsIHJ1bm5pbmcgfSkgPT4ge1xuICBjb25zdCBlbmRSZWYgPSB1c2VSZWYobnVsbCk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZW5kUmVmLmN1cnJlbnQpIHtcbiAgICAgIGVuZFJlZi5jdXJyZW50LnNjcm9sbEludG9WaWV3KHsgYmVoYXZpb3I6ICdzbW9vdGgnIH0pO1xuICAgIH1cbiAgfSwgW2xvZ3NdKTtcblxuICBjb25zdCBlbGFwc2VkID0gdXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKCFzeW5jaW5nKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBzZWNvbmRzID0gTWF0aC5mbG9vcigoRGF0ZS5ub3coKSAtIHdpbmRvdy5fc3luY1N0YXJ0KSAvIDEwMDApO1xuICAgIGNvbnN0IG0gPSBNYXRoLmZsb29yKHNlY29uZHMgLyA2MCk7XG4gICAgY29uc3QgcyA9IHNlY29uZHMgJSA2MDtcbiAgICByZXR1cm4gYCR7bX06JHtzLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX1gO1xuICB9LCBbbG9ncywgc3luY2luZ10pO1xuXG4gIHJldHVybiAoXG4gICAgPEJveCBtdD1cImxnXCI+XG4gICAgICA8SDQgbWI9XCJsZ1wiIHN0eWxlPXt7IGNvbG9yOiAnI2U2ZWRmMycgfX0+UGlwZWxpbmUgTG9nczwvSDQ+XG4gICAgICA8Qm94IHN0eWxlPXtzdHlsZXMudGVybWluYWx9PlxuICAgICAgICA8Qm94IHN0eWxlPXtzdHlsZXMudGVybWluYWxIZWFkZXJ9PlxuICAgICAgICAgIDxCb3ggZmxleCBhbGlnbkl0ZW1zPVwiY2VudGVyXCIgZ2FwPVwibWRcIj5cbiAgICAgICAgICAgIDxCYWRnZSB2YXJpYW50PXtzeW5jaW5nID8gJ3ByaW1hcnknIDogcnVubmluZyA/ICdwcmltYXJ5JyA6ICdkZWZhdWx0J30+XG4gICAgICAgICAgICAgIHtzeW5jaW5nID8gJ1JVTk5JTkcnIDogcnVubmluZyA/ICdSVU5OSU5HJyA6ICdDT01QTEVURUQnfVxuICAgICAgICAgICAgPC9CYWRnZT5cbiAgICAgICAgICAgIHtzeW5jaW5nICYmIChcbiAgICAgICAgICAgICAgPFRleHQgc3R5bGU9e3sgY29sb3I6ICcjOGI5NDllJywgZm9udFNpemU6ICcxMnB4JyB9fT5cbiAgICAgICAgICAgICAgICBFbGFwc2VkOiB7ZWxhcHNlZCB8fCAnMDowMCd9XG4gICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgPFRleHQgc3R5bGU9e3sgY29sb3I6ICcjOGI5NDllJywgZm9udFNpemU6ICcxMnB4JyB9fT5cbiAgICAgICAgICAgIHtsb2dzLmxlbmd0aH0gbGluZXtsb2dzLmxlbmd0aCAhPT0gMSA/ICdzJyA6ICcnfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxCb3ggc3R5bGU9e3N0eWxlcy50ZXJtaW5hbEJvZHl9PlxuICAgICAgICAgIHtsb2dzLmxlbmd0aCA9PT0gMCAmJiBzeW5jaW5nICYmIChcbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgLi4uc3R5bGVzLmxvZ0xpbmUsIGNvbG9yOiAnIzQ4NGY1OCcgfX0+XG4gICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXtzdHlsZXMubGluZU51bWJlcn0+MTwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4+V2FpdGluZyBmb3Igb3V0cHV0Li4uPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cbiAgICAgICAgICB7bG9ncy5tYXAoKGVudHJ5LCBpKSA9PiAoXG4gICAgICAgICAgICA8TG9nRW50cnkga2V5PXtpfSBpbmRleD17aX0gdGV4dD17ZW50cnl9IC8+XG4gICAgICAgICAgKSl9XG4gICAgICAgICAgPGRpdiByZWY9e2VuZFJlZn0gLz5cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L0JveD5cbiAgICA8L0JveD5cbiAgKTtcbn07XG5cbmNvbnN0IEFkbWluRGFzaGJvYXJkID0gKCkgPT4ge1xuICBjb25zdCBbc3RhdHMsIHNldFN0YXRzXSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3QgW3N5bmNpbmcsIHNldFN5bmNpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc3luY0Vycm9yLCBzZXRTeW5jRXJyb3JdID0gdXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IFtzeW5jU3VjY2Vzcywgc2V0U3luY1N1Y2Nlc3NdID0gdXNlU3RhdGUobnVsbCk7XG4gIGNvbnN0IFtoaXN0b3J5LCBzZXRIaXN0b3J5XSA9IHVzZVN0YXRlKFtdKTtcbiAgY29uc3QgW2xvZ3MsIHNldExvZ3NdID0gdXNlU3RhdGUoW10pO1xuICBjb25zdCBbc3RvcHBpbmcsIHNldFN0b3BwaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICBjb25zdCBmZXRjaERhc2hib2FyZCA9IGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hZG1pbi9hcGkvZGFzaGJvYXJkJyk7XG4gICAgICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7cmVzLnN0YXR1c31gKTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgc2V0U3RhdHMoZGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdBZG1pbkRhc2hib2FyZDogZmFpbGVkIHRvIGxvYWQgZGFzaGJvYXJkIGRhdGEnLCBlcnIpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRMb2FkaW5nKGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgZmV0Y2hIaXN0b3J5ID0gYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnL2FkbWluL2FwaS9kaXNjb3ZlcnkvaGlzdG9yeScpO1xuICAgICAgaWYgKCFyZXMub2spIHJldHVybjtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKGRhdGEuaGlzdG9yeSkgc2V0SGlzdG9yeShkYXRhLmhpc3RvcnkpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLyogbm9uLWNyaXRpY2FsICovXG4gICAgfVxuICB9O1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgZmV0Y2hEYXNoYm9hcmQoKTtcbiAgICBmZXRjaEhpc3RvcnkoKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IGhhbmRsZVN5bmMgPSBhc3luYyAoKSA9PiB7XG4gICAgc2V0U3luY2luZyh0cnVlKTtcbiAgICBzZXRTeW5jRXJyb3IobnVsbCk7XG4gICAgc2V0U3luY1N1Y2Nlc3MobnVsbCk7XG4gICAgc2V0TG9ncyhbXSk7XG4gICAgc2V0U3RvcHBpbmcoZmFsc2UpO1xuICAgIHdpbmRvdy5fc3luY1N0YXJ0ID0gRGF0ZS5ub3coKTtcblxuICAgIGNvbnN0IHBvbGxJbnRlcnZhbCA9IHNldEludGVydmFsKGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYWRtaW4vYXBpL2Rpc2NvdmVyeS9sb2dzJyk7XG4gICAgICAgIGlmIChyZXMub2spIHtcbiAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgICBpZiAoZGF0YS5sb2dzKSBzZXRMb2dzKGRhdGEubG9ncyk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKF8pIHt9XG4gICAgfSwgMjAwMCk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJy9hZG1pbi9hcGkvZGlzY292ZXJ5L3N0YXJ0Jyk7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihyZXN1bHQubWVzc2FnZSB8fCAnU3luYyBmYWlsZWQnKTtcbiAgICAgIHNldFN5bmNTdWNjZXNzKCdEaXNjb3Zlcnkgc3luYyBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5IScpO1xuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoW2ZldGNoRGFzaGJvYXJkKCksIGZldGNoSGlzdG9yeSgpXSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBzZXRTeW5jRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhckludGVydmFsKHBvbGxJbnRlcnZhbCk7XG4gICAgICBzZXRTeW5jaW5nKGZhbHNlKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYWRtaW4vYXBpL2Rpc2NvdmVyeS9sb2dzJyk7XG4gICAgICAgIGlmIChyZXMub2spIHtcbiAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgICBpZiAoZGF0YS5sb2dzKSBzZXRMb2dzKGRhdGEubG9ncyk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKF8pIHt9XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVN0b3AgPSBhc3luYyAoKSA9PiB7XG4gICAgc2V0U3RvcHBpbmcodHJ1ZSk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYWRtaW4vYXBpL2Rpc2NvdmVyeS9zdG9wJyk7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoZGF0YS5tZXNzYWdlIHx8ICdGYWlsZWQgdG8gc3RvcCcpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgc2V0U3luY0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0U3RvcHBpbmcoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICBpZiAobG9hZGluZykge1xuICAgIHJldHVybiAoXG4gICAgICA8Qm94IHA9XCJ4eGxcIiBmbGV4IGp1c3RpZnlDb250ZW50PVwiY2VudGVyXCIgYWxpZ25JdGVtcz1cImNlbnRlclwiPlxuICAgICAgICA8TG9hZGVyIC8+XG4gICAgICA8L0JveD5cbiAgICApO1xuICB9XG5cbiAgY29uc3QgaXNSdW5uaW5nID0gc3RhdHM/LmRpc2NvdmVyeT8uaXNSdW5uaW5nO1xuICBjb25zdCBsYXN0UnVuID0gc3RhdHM/LmRpc2NvdmVyeT8ubGFzdFJ1bjtcblxuICByZXR1cm4gKFxuICAgIDxCb3ggcD1cInhsXCI+XG4gICAgICA8Qm94IG1iPVwieGxcIj5cbiAgICAgICAgPEgyPkRhc2hib2FyZDwvSDI+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwiZ3JleTgwXCI+T3ZlcnZpZXcgb2YgQ0xJIEh1YiBzeXN0ZW08L1RleHQ+XG4gICAgICA8L0JveD5cblxuICAgICAgPEJveCBmbGV4IGZsZXhXcmFwPVwid3JhcFwiIGdhcD1cImxnXCIgbWI9XCJ4eGxcIj5cbiAgICAgICAgPFN0YXRDYXJkIGxhYmVsPVwiVG90YWwgVG9vbHNcIiB2YWx1ZT17c3RhdHM/LnRvdGFsVG9vbHMgPz8gMH0gaWNvbj1cIlRlcm1pbmFsXCIgLz5cbiAgICAgICAgPFN0YXRDYXJkIGxhYmVsPVwiQWN0aXZlIFRvb2xzXCIgdmFsdWU9e3N0YXRzPy5hY3RpdmVUb29scyA/PyAwfSBpY29uPVwiQ2hlY2tcIiAvPlxuICAgICAgICA8U3RhdENhcmQgbGFiZWw9XCJVc2Vyc1wiIHZhbHVlPXtzdGF0cz8udG90YWxVc2VycyA/PyAwfSBpY29uPVwiVXNlclwiIC8+XG4gICAgICAgIDxTdGF0Q2FyZCBsYWJlbD1cIkNhdGVnb3JpZXNcIiB2YWx1ZT17c3RhdHM/LnRvdGFsQ2F0ZWdvcmllcyA/PyAwfSBpY29uPVwiRm9sZGVyXCIgLz5cbiAgICAgIDwvQm94PlxuXG4gICAgICA8Qm94IG1iPVwieHhsXCI+XG4gICAgICAgIDxINCBtYj1cImxnXCI+RGlzY292ZXJ5IFN5bmM8L0g0PlxuICAgICAgICA8Qm94IHZhcmlhbnQ9XCJjYXJkXCIgcD1cInhsXCI+XG4gICAgICAgICAge2xhc3RSdW4gJiYgIXN5bmNpbmcgJiYgIWlzUnVubmluZyA/IChcbiAgICAgICAgICAgIDxCb3ggbWI9XCJsZ1wiPlxuICAgICAgICAgICAgICA8VGV4dCBmb250V2VpZ2h0PVwiYm9sZFwiPkxhc3QgUnVuOjwvVGV4dD5cbiAgICAgICAgICAgICAgPEJveCBtdD1cInNtXCIgZmxleCBhbGlnbkl0ZW1zPVwiY2VudGVyXCIgZ2FwPVwibWRcIj5cbiAgICAgICAgICAgICAgICA8QmFkZ2UgdmFyaWFudD17c3RhdHVzVmFyaWFudChsYXN0UnVuLnN0YXR1cyl9PntsYXN0UnVuLnN0YXR1c308L0JhZGdlPlxuICAgICAgICAgICAgICAgIDxUZXh0IGFzPVwic3BhblwiIGZvbnRTaXplPVwic21cIj57bmV3IERhdGUobGFzdFJ1bi5zdGFydGVkQXQpLnRvTG9jYWxlU3RyaW5nKCl9PC9UZXh0PlxuICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgPEJveCBtdD1cIm1kXCIgZmxleCBnYXA9XCJ4eGxcIj5cbiAgICAgICAgICAgICAgICA8VGV4dCBmb250U2l6ZT1cInNtXCI+RHVyYXRpb246IHtsYXN0UnVuLmR1cmF0aW9ufW1zPC9UZXh0PlxuICAgICAgICAgICAgICAgIDxUZXh0IGZvbnRTaXplPVwic21cIj5DYW5kaWRhdGVzOiB7bGFzdFJ1bi5jYW5kaWRhdGVzfTwvVGV4dD5cbiAgICAgICAgICAgICAgICA8VGV4dCBmb250U2l6ZT1cInNtXCI+SW5zZXJ0ZWQ6IHtsYXN0UnVuLmluc2VydGVkfTwvVGV4dD5cbiAgICAgICAgICAgICAgICA8VGV4dCBmb250U2l6ZT1cInNtXCI+RXJyb3JzOiB7bGFzdFJ1bi5lcnJvcnN9PC9UZXh0PlxuICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgICAgeyFsYXN0UnVuICYmICFzeW5jaW5nICYmICFpc1J1bm5pbmcgPyAoXG4gICAgICAgICAgICA8VGV4dCBtYj1cImxnXCIgY29sb3I9XCJncmV5NjBcIj5ObyBkaXNjb3ZlcnkgcnVucyB5ZXQuPC9UZXh0PlxuICAgICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgICAge3N5bmNFcnJvciAmJiA8Qm94IG1iPVwibWRcIj48VGV4dCBjb2xvcj1cImRhbmdlclwiPntzeW5jRXJyb3J9PC9UZXh0PjwvQm94Pn1cbiAgICAgICAgICB7c3luY1N1Y2Nlc3MgJiYgPEJveCBtYj1cIm1kXCI+PFRleHQgY29sb3I9XCJzdWNjZXNzXCI+e3N5bmNTdWNjZXNzfTwvVGV4dD48L0JveD59XG5cbiAgICAgICAgICA8Qm94IGZsZXggZ2FwPVwibWRcIiBhbGlnbkl0ZW1zPVwiY2VudGVyXCI+XG4gICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgIHZhcmlhbnQ9XCJwcmltYXJ5XCJcbiAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlU3luY31cbiAgICAgICAgICAgICAgZGlzYWJsZWQ9e3N5bmNpbmcgfHwgaXNSdW5uaW5nfVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7c3luY2luZyA/ICdTeW5jaW5nLi4uJyA6IGlzUnVubmluZyA/ICdTeW5jIGluIHByb2dyZXNzLi4uJyA6ICdTeW5jIE5vdyd9XG4gICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgIHsoc3luY2luZyB8fCBpc1J1bm5pbmcpICYmIChcbiAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgIHZhcmlhbnQ9XCJkYW5nZXJcIlxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVN0b3B9XG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3N0b3BwaW5nfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAge3N0b3BwaW5nID8gJ1N0b3BwaW5nLi4uJyA6ICdTdG9wIFN5bmMnfVxuICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9Cb3g+XG5cbiAgICAgICAgICB7KHN5bmNpbmcgfHwgaXNSdW5uaW5nIHx8IGxvZ3MubGVuZ3RoID4gMCkgJiYgKFxuICAgICAgICAgICAgPExvZ1ZpZXdlciBsb2dzPXtsb2dzfSBzeW5jaW5nPXtzeW5jaW5nfSBydW5uaW5nPXtpc1J1bm5pbmd9IC8+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L0JveD5cblxuICAgICAge2hpc3RvcnkubGVuZ3RoID4gMCAmJiAhc3luY2luZyAmJiAhaXNSdW5uaW5nICYmIChcbiAgICAgICAgPEJveD5cbiAgICAgICAgICA8SDQgbWI9XCJsZ1wiPlN5bmMgSGlzdG9yeSAoTGFzdCB7aGlzdG9yeS5sZW5ndGh9KTwvSDQ+XG4gICAgICAgICAgPFRhYmxlPlxuICAgICAgICAgICAgPFRhYmxlSGVhZD5cbiAgICAgICAgICAgICAgPFRhYmxlUm93PlxuICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+PFRleHQgZm9udFdlaWdodD1cImJvbGRcIj5TdGFydGVkPC9UZXh0PjwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+PFRleHQgZm9udFdlaWdodD1cImJvbGRcIj5TdGF0dXM8L1RleHQ+PC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD48VGV4dCBmb250V2VpZ2h0PVwiYm9sZFwiPkNhbmRpZGF0ZXM8L1RleHQ+PC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD48VGV4dCBmb250V2VpZ2h0PVwiYm9sZFwiPkluc2VydGVkPC9UZXh0PjwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+PFRleHQgZm9udFdlaWdodD1cImJvbGRcIj5FcnJvcnM8L1RleHQ+PC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD48VGV4dCBmb250V2VpZ2h0PVwiYm9sZFwiPkR1cmF0aW9uPC9UZXh0PjwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICA8L1RhYmxlUm93PlxuICAgICAgICAgICAgPC9UYWJsZUhlYWQ+XG4gICAgICAgICAgICA8VGFibGVCb2R5PlxuICAgICAgICAgICAgICB7aGlzdG9yeS5tYXAocnVuID0+IChcbiAgICAgICAgICAgICAgICA8VGFibGVSb3cga2V5PXtydW4uX2lkfT5cbiAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+e25ldyBEYXRlKHJ1bi5zdGFydGVkQXQpLnRvTG9jYWxlU3RyaW5nKCl9PC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICA8VGFibGVDZWxsPjxCYWRnZSB2YXJpYW50PXtzdGF0dXNWYXJpYW50KHJ1bi5zdGF0dXMpfT57cnVuLnN0YXR1c308L0JhZGdlPjwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD57cnVuLmNhbmRpZGF0ZXMgPz8gMH08L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+e3J1bi5pbnNlcnRlZCA/PyAwfTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD57cnVuLmVycm9ycyA/PyAwfTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD57cnVuLmR1cmF0aW9uID8gYCR7cnVuLmR1cmF0aW9ufW1zYCA6ICctJ308L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICA8L1RhYmxlUm93PlxuICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgIDwvVGFibGVCb2R5PlxuICAgICAgICAgIDwvVGFibGU+XG4gICAgICAgIDwvQm94PlxuICAgICAgKX1cbiAgICA8L0JveD5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEFkbWluRGFzaGJvYXJkOyIsIkFkbWluSlMuVXNlckNvbXBvbmVudHMgPSB7fVxuaW1wb3J0IEFkbWluRGFzaGJvYXJkIGZyb20gJy4uL2FkbWluL0FkbWluRGFzaGJvYXJkJ1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5BZG1pbkRhc2hib2FyZCA9IEFkbWluRGFzaGJvYXJkIl0sIm5hbWVzIjpbIlN0YXRDYXJkIiwibGFiZWwiLCJ2YWx1ZSIsImljb24iLCJSZWFjdCIsImNyZWF0ZUVsZW1lbnQiLCJCb3giLCJ2YXJpYW50IiwicCIsImZsZXgiLCJhbGlnbkl0ZW1zIiwiZ2FwIiwiZmxleEJhc2lzIiwiZmxleEdyb3ciLCJJY29uIiwic2l6ZSIsImNvbG9yIiwiVGV4dCIsImZvbnRXZWlnaHQiLCJtdCIsInN0YXR1c1ZhcmlhbnQiLCJzdGF0dXMiLCJzdHlsZXMiLCJ0ZXJtaW5hbCIsImJhY2tncm91bmQiLCJib3JkZXIiLCJib3JkZXJSYWRpdXMiLCJmb250RmFtaWx5IiwiZm9udFNpemUiLCJsaW5lSGVpZ2h0Iiwib3ZlcmZsb3ciLCJ0ZXJtaW5hbEhlYWRlciIsImJvcmRlckJvdHRvbSIsInBhZGRpbmciLCJkaXNwbGF5IiwianVzdGlmeUNvbnRlbnQiLCJ0ZXJtaW5hbEJvZHkiLCJtYXhIZWlnaHQiLCJvdmVyZmxvd1kiLCJsb2dMaW5lIiwibWluSGVpZ2h0IiwibGluZU51bWJlciIsIm1pbldpZHRoIiwidGV4dEFsaWduIiwicGFkZGluZ1JpZ2h0IiwidXNlclNlbGVjdCIsImZsZXhTaHJpbmsiLCJsaW5lQ29sb3IiLCJ0ZXh0IiwidGVzdCIsIkxvZ0VudHJ5IiwiaW5kZXgiLCJ1c2VNZW1vIiwic3R5bGUiLCJ3aGl0ZVNwYWNlIiwid29yZEJyZWFrIiwiTG9nVmlld2VyIiwibG9ncyIsInN5bmNpbmciLCJydW5uaW5nIiwiZW5kUmVmIiwidXNlUmVmIiwidXNlRWZmZWN0IiwiY3VycmVudCIsInNjcm9sbEludG9WaWV3IiwiYmVoYXZpb3IiLCJlbGFwc2VkIiwic2Vjb25kcyIsIk1hdGgiLCJmbG9vciIsIkRhdGUiLCJub3ciLCJ3aW5kb3ciLCJfc3luY1N0YXJ0IiwibSIsInMiLCJ0b1N0cmluZyIsInBhZFN0YXJ0IiwiSDQiLCJtYiIsIkJhZGdlIiwibGVuZ3RoIiwibWFwIiwiZW50cnkiLCJpIiwia2V5IiwicmVmIiwiQWRtaW5EYXNoYm9hcmQiLCJzdGF0cyIsInNldFN0YXRzIiwidXNlU3RhdGUiLCJsb2FkaW5nIiwic2V0TG9hZGluZyIsInNldFN5bmNpbmciLCJzeW5jRXJyb3IiLCJzZXRTeW5jRXJyb3IiLCJzeW5jU3VjY2VzcyIsInNldFN5bmNTdWNjZXNzIiwiaGlzdG9yeSIsInNldEhpc3RvcnkiLCJzZXRMb2dzIiwic3RvcHBpbmciLCJzZXRTdG9wcGluZyIsImZldGNoRGFzaGJvYXJkIiwicmVzIiwiZmV0Y2giLCJvayIsIkVycm9yIiwiZGF0YSIsImpzb24iLCJlcnIiLCJjb25zb2xlIiwiZXJyb3IiLCJmZXRjaEhpc3RvcnkiLCJoYW5kbGVTeW5jIiwicG9sbEludGVydmFsIiwic2V0SW50ZXJ2YWwiLCJfIiwicmVzdWx0IiwibWVzc2FnZSIsIlByb21pc2UiLCJhbGwiLCJjbGVhckludGVydmFsIiwiaGFuZGxlU3RvcCIsIkxvYWRlciIsImlzUnVubmluZyIsImRpc2NvdmVyeSIsImxhc3RSdW4iLCJIMiIsImZsZXhXcmFwIiwidG90YWxUb29scyIsImFjdGl2ZVRvb2xzIiwidG90YWxVc2VycyIsInRvdGFsQ2F0ZWdvcmllcyIsImFzIiwic3RhcnRlZEF0IiwidG9Mb2NhbGVTdHJpbmciLCJkdXJhdGlvbiIsImNhbmRpZGF0ZXMiLCJpbnNlcnRlZCIsImVycm9ycyIsIkJ1dHRvbiIsIm9uQ2xpY2siLCJkaXNhYmxlZCIsIlRhYmxlIiwiVGFibGVIZWFkIiwiVGFibGVSb3ciLCJUYWJsZUNlbGwiLCJUYWJsZUJvZHkiLCJydW4iLCJfaWQiLCJBZG1pbkpTIiwiVXNlckNvbXBvbmVudHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7RUFHQSxNQUFNQSxRQUFRLEdBQUdBLENBQUM7SUFBRUMsS0FBSztJQUFFQyxLQUFLO0VBQUVDLEVBQUFBO0VBQUssQ0FBQyxrQkFDdENDLHNCQUFBLENBQUFDLGFBQUEsQ0FBQ0MsZ0JBQUcsRUFBQTtFQUFDQyxFQUFBQSxPQUFPLEVBQUMsTUFBTTtFQUFDQyxFQUFBQSxDQUFDLEVBQUMsSUFBSTtJQUFDQyxJQUFJLEVBQUEsSUFBQTtFQUFDQyxFQUFBQSxVQUFVLEVBQUMsUUFBUTtFQUFDQyxFQUFBQSxHQUFHLEVBQUMsSUFBSTtFQUFDQyxFQUFBQSxTQUFTLEVBQUMsT0FBTztFQUFDQyxFQUFBQSxRQUFRLEVBQUU7RUFBRSxDQUFBLGVBQ3pGVCxzQkFBQSxDQUFBQyxhQUFBLENBQUNTLGlCQUFJLEVBQUE7RUFBQ1gsRUFBQUEsSUFBSSxFQUFFQSxJQUFLO0VBQUNZLEVBQUFBLElBQUksRUFBRSxFQUFHO0VBQUNDLEVBQUFBLEtBQUssRUFBQztFQUFZLENBQUUsQ0FBQyxlQUNqRFosc0JBQUEsQ0FBQUMsYUFBQSxDQUFDQyxnQkFBRyxFQUFBLElBQUEsZUFDRkYsc0JBQUEsQ0FBQUMsYUFBQSxDQUFDWSxpQkFBSSxFQUFBO0VBQUNWLEVBQUFBLE9BQU8sRUFBQyxJQUFJO0VBQUNTLEVBQUFBLEtBQUssRUFBQztFQUFRLENBQUEsRUFBRWYsS0FBWSxDQUFDLGVBQ2hERyxzQkFBQSxDQUFBQyxhQUFBLENBQUNZLGlCQUFJLEVBQUE7RUFBQ1YsRUFBQUEsT0FBTyxFQUFDLEtBQUs7RUFBQ1csRUFBQUEsVUFBVSxFQUFDLE1BQU07RUFBQ0MsRUFBQUEsRUFBRSxFQUFDO0VBQVMsQ0FBQSxFQUFFakIsS0FBWSxDQUM3RCxDQUNGLENBQ047RUFFRCxNQUFNa0IsYUFBYSxHQUFJQyxNQUFNLElBQUs7RUFDaEMsRUFBQSxRQUFRQSxNQUFNO0VBQ1osSUFBQSxLQUFLLFdBQVc7RUFBRSxNQUFBLE9BQU8sU0FBUztFQUNsQyxJQUFBLEtBQUssU0FBUztFQUFFLE1BQUEsT0FBTyxTQUFTO0VBQ2hDLElBQUEsS0FBSyxRQUFRO0VBQUUsTUFBQSxPQUFPLFFBQVE7RUFDOUIsSUFBQTtFQUFTLE1BQUEsT0FBTyxTQUFTO0VBQzNCO0VBQ0YsQ0FBQztFQUVELE1BQU1DLE1BQU0sR0FBRztFQUNiQyxFQUFBQSxRQUFRLEVBQUU7RUFDUkMsSUFBQUEsVUFBVSxFQUFFLFNBQVM7RUFDckJDLElBQUFBLE1BQU0sRUFBRSxtQkFBbUI7RUFDM0JDLElBQUFBLFlBQVksRUFBRSxLQUFLO0VBQ25CQyxJQUFBQSxVQUFVLEVBQUUsK0NBQStDO0VBQzNEQyxJQUFBQSxRQUFRLEVBQUUsTUFBTTtFQUNoQkMsSUFBQUEsVUFBVSxFQUFFLEtBQUs7RUFDakJDLElBQUFBLFFBQVEsRUFBRTtLQUNYO0VBQ0RDLEVBQUFBLGNBQWMsRUFBRTtFQUNkUCxJQUFBQSxVQUFVLEVBQUUsU0FBUztFQUNyQlEsSUFBQUEsWUFBWSxFQUFFLG1CQUFtQjtFQUNqQ0MsSUFBQUEsT0FBTyxFQUFFLFVBQVU7RUFDbkJDLElBQUFBLE9BQU8sRUFBRSxNQUFNO0VBQ2Z4QixJQUFBQSxVQUFVLEVBQUUsUUFBUTtFQUNwQnlCLElBQUFBLGNBQWMsRUFBRTtLQUNqQjtFQUNEQyxFQUFBQSxZQUFZLEVBQUU7RUFDWkgsSUFBQUEsT0FBTyxFQUFFLE9BQU87RUFDaEJJLElBQUFBLFNBQVMsRUFBRSxPQUFPO0VBQ2xCQyxJQUFBQSxTQUFTLEVBQUU7S0FDWjtFQUNEQyxFQUFBQSxPQUFPLEVBQUU7RUFDUEwsSUFBQUEsT0FBTyxFQUFFLE1BQU07RUFDZkQsSUFBQUEsT0FBTyxFQUFFLFFBQVE7RUFDakJPLElBQUFBLFNBQVMsRUFBRSxNQUFNO0VBQ2pCOUIsSUFBQUEsVUFBVSxFQUFFO0tBQ2I7RUFDRCtCLEVBQUFBLFVBQVUsRUFBRTtFQUNWekIsSUFBQUEsS0FBSyxFQUFFLFNBQVM7RUFDaEIwQixJQUFBQSxRQUFRLEVBQUUsTUFBTTtFQUNoQkMsSUFBQUEsU0FBUyxFQUFFLE9BQU87RUFDbEJDLElBQUFBLFlBQVksRUFBRSxNQUFNO0VBQ3BCQyxJQUFBQSxVQUFVLEVBQUUsTUFBTTtFQUNsQkMsSUFBQUEsVUFBVSxFQUFFO0VBQ2Q7RUFDRixDQUFDO0VBRUQsTUFBTUMsU0FBUyxHQUFJQyxJQUFJLElBQUs7SUFDMUIsSUFBSSxHQUFHLENBQUNDLElBQUksQ0FBQ0QsSUFBSSxDQUFDLEVBQUUsT0FBTyxTQUFTO0lBQ3BDLElBQUksR0FBRyxDQUFDQyxJQUFJLENBQUNELElBQUksQ0FBQyxFQUFFLE9BQU8sU0FBUztJQUNwQyxJQUFJLEdBQUcsQ0FBQ0MsSUFBSSxDQUFDRCxJQUFJLENBQUMsRUFBRSxPQUFPLFNBQVM7SUFDcEMsSUFBSSxtQkFBbUIsQ0FBQ0MsSUFBSSxDQUFDRCxJQUFJLENBQUMsRUFBRSxPQUFPLFNBQVM7SUFDcEQsSUFBSSxzQkFBc0IsQ0FBQ0MsSUFBSSxDQUFDRCxJQUFJLENBQUMsRUFBRSxPQUFPLFNBQVM7SUFDdkQsSUFBSSxHQUFHLENBQUNDLElBQUksQ0FBQ0QsSUFBSSxDQUFDLEVBQUUsT0FBTyxTQUFTO0lBQ3BDLElBQUksYUFBYSxDQUFDQyxJQUFJLENBQUNELElBQUksQ0FBQyxFQUFFLE9BQU8sU0FBUztFQUM5QyxFQUFBLE9BQU8sU0FBUztFQUNsQixDQUFDO0VBRUQsTUFBTUUsUUFBUSxHQUFHQSxDQUFDO0lBQUVDLEtBQUs7RUFBRUgsRUFBQUE7RUFBSyxDQUFDLEtBQUs7RUFDcEMsRUFBQSxNQUFNaEMsS0FBSyxHQUFHb0MsYUFBTyxDQUFDLE1BQU1MLFNBQVMsQ0FBQ0MsSUFBSSxDQUFDLEVBQUUsQ0FBQ0EsSUFBSSxDQUFDLENBQUM7SUFPcEQsb0JBQ0U1QyxzQkFBQSxDQUFBQyxhQUFBLENBQUEsS0FBQSxFQUFBO0VBQ0VnRCxJQUFBQSxLQUFLLEVBQUU7UUFDTCxHQUFHL0IsTUFBTSxDQUFDaUIsT0FBTztRQUNqQmYsVUFBVSxFQUFFMkIsS0FBSyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsYUFBYSxHQUFHO0VBQ2hEO0tBQUUsZUFFRi9DLHNCQUFBLENBQUFDLGFBQUEsQ0FBQSxNQUFBLEVBQUE7TUFBTWdELEtBQUssRUFBRS9CLE1BQU0sQ0FBQ21CO0VBQVcsR0FBQSxFQUFFVSxLQUFLLEdBQUcsQ0FBUSxDQUFDLGVBQ2xEL0Msc0JBQUEsQ0FBQUMsYUFBQSxDQUFBLE1BQUEsRUFBQTtFQUFNZ0QsSUFBQUEsS0FBSyxFQUFFO1FBQUVyQyxLQUFLO0VBQUVzQyxNQUFBQSxVQUFVLEVBQUUsVUFBVTtFQUFFQyxNQUFBQSxTQUFTLEVBQUU7RUFBYTtLQUFFLEVBQ3JFUCxJQUNHLENBQ0gsQ0FBQztFQUVWLENBQUM7RUFFRCxNQUFNUSxTQUFTLEdBQUdBLENBQUM7SUFBRUMsSUFBSTtJQUFFQyxPQUFPO0VBQUVDLEVBQUFBO0VBQVEsQ0FBQyxLQUFLO0VBQ2hELEVBQUEsTUFBTUMsTUFBTSxHQUFHQyxZQUFNLENBQUMsSUFBSSxDQUFDO0VBRTNCQyxFQUFBQSxlQUFTLENBQUMsTUFBTTtNQUNkLElBQUlGLE1BQU0sQ0FBQ0csT0FBTyxFQUFFO0VBQ2xCSCxNQUFBQSxNQUFNLENBQUNHLE9BQU8sQ0FBQ0MsY0FBYyxDQUFDO0VBQUVDLFFBQUFBLFFBQVEsRUFBRTtFQUFTLE9BQUMsQ0FBQztFQUN2RCxJQUFBO0VBQ0YsRUFBQSxDQUFDLEVBQUUsQ0FBQ1IsSUFBSSxDQUFDLENBQUM7RUFFVixFQUFBLE1BQU1TLE9BQU8sR0FBR2QsYUFBTyxDQUFDLE1BQU07RUFDNUIsSUFBQSxJQUFJLENBQUNNLE9BQU8sRUFBRSxPQUFPLElBQUk7RUFDekIsSUFBQSxNQUFNUyxPQUFPLEdBQUdDLElBQUksQ0FBQ0MsS0FBSyxDQUFDLENBQUNDLElBQUksQ0FBQ0MsR0FBRyxFQUFFLEdBQUdDLE1BQU0sQ0FBQ0MsVUFBVSxJQUFJLElBQUksQ0FBQztNQUNuRSxNQUFNQyxDQUFDLEdBQUdOLElBQUksQ0FBQ0MsS0FBSyxDQUFDRixPQUFPLEdBQUcsRUFBRSxDQUFDO0VBQ2xDLElBQUEsTUFBTVEsQ0FBQyxHQUFHUixPQUFPLEdBQUcsRUFBRTtFQUN0QixJQUFBLE9BQU8sQ0FBQSxFQUFHTyxDQUFDLENBQUEsQ0FBQSxFQUFJQyxDQUFDLENBQUNDLFFBQVEsRUFBRSxDQUFDQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFBLENBQUU7RUFDaEQsRUFBQSxDQUFDLEVBQUUsQ0FBQ3BCLElBQUksRUFBRUMsT0FBTyxDQUFDLENBQUM7RUFFbkIsRUFBQSxvQkFDRXRELHNCQUFBLENBQUFDLGFBQUEsQ0FBQ0MsZ0JBQUcsRUFBQTtFQUFDYSxJQUFBQSxFQUFFLEVBQUM7RUFBSSxHQUFBLGVBQ1ZmLHNCQUFBLENBQUFDLGFBQUEsQ0FBQ3lFLGVBQUUsRUFBQTtFQUFDQyxJQUFBQSxFQUFFLEVBQUMsSUFBSTtFQUFDMUIsSUFBQUEsS0FBSyxFQUFFO0VBQUVyQyxNQUFBQSxLQUFLLEVBQUU7RUFBVTtFQUFFLEdBQUEsRUFBQyxlQUFpQixDQUFDLGVBQzNEWixzQkFBQSxDQUFBQyxhQUFBLENBQUNDLGdCQUFHLEVBQUE7TUFBQytDLEtBQUssRUFBRS9CLE1BQU0sQ0FBQ0M7RUFBUyxHQUFBLGVBQzFCbkIsc0JBQUEsQ0FBQUMsYUFBQSxDQUFDQyxnQkFBRyxFQUFBO01BQUMrQyxLQUFLLEVBQUUvQixNQUFNLENBQUNTO0VBQWUsR0FBQSxlQUNoQzNCLHNCQUFBLENBQUFDLGFBQUEsQ0FBQ0MsZ0JBQUcsRUFBQTtNQUFDRyxJQUFJLEVBQUEsSUFBQTtFQUFDQyxJQUFBQSxVQUFVLEVBQUMsUUFBUTtFQUFDQyxJQUFBQSxHQUFHLEVBQUM7RUFBSSxHQUFBLGVBQ3BDUCxzQkFBQSxDQUFBQyxhQUFBLENBQUMyRSxrQkFBSyxFQUFBO01BQUN6RSxPQUFPLEVBQUVtRCxPQUFPLEdBQUcsU0FBUyxHQUFHQyxPQUFPLEdBQUcsU0FBUyxHQUFHO0VBQVUsR0FBQSxFQUNuRUQsT0FBTyxHQUFHLFNBQVMsR0FBR0MsT0FBTyxHQUFHLFNBQVMsR0FBRyxXQUN4QyxDQUFDLEVBQ1BELE9BQU8saUJBQ050RCxzQkFBQSxDQUFBQyxhQUFBLENBQUNZLGlCQUFJLEVBQUE7RUFBQ29DLElBQUFBLEtBQUssRUFBRTtFQUFFckMsTUFBQUEsS0FBSyxFQUFFLFNBQVM7RUFBRVksTUFBQUEsUUFBUSxFQUFFO0VBQU87RUFBRSxHQUFBLEVBQUMsV0FDMUMsRUFBQ3NDLE9BQU8sSUFBSSxNQUNqQixDQUVMLENBQUMsZUFDTjlELHNCQUFBLENBQUFDLGFBQUEsQ0FBQ1ksaUJBQUksRUFBQTtFQUFDb0MsSUFBQUEsS0FBSyxFQUFFO0VBQUVyQyxNQUFBQSxLQUFLLEVBQUUsU0FBUztFQUFFWSxNQUFBQSxRQUFRLEVBQUU7RUFBTztLQUFFLEVBQ2pENkIsSUFBSSxDQUFDd0IsTUFBTSxFQUFDLE9BQUssRUFBQ3hCLElBQUksQ0FBQ3dCLE1BQU0sS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQ3pDLENBQ0gsQ0FBQyxlQUNON0Usc0JBQUEsQ0FBQUMsYUFBQSxDQUFDQyxnQkFBRyxFQUFBO01BQUMrQyxLQUFLLEVBQUUvQixNQUFNLENBQUNjO0tBQWEsRUFDN0JxQixJQUFJLENBQUN3QixNQUFNLEtBQUssQ0FBQyxJQUFJdkIsT0FBTyxpQkFDM0J0RCxzQkFBQSxDQUFBQyxhQUFBLENBQUEsS0FBQSxFQUFBO0VBQUtnRCxJQUFBQSxLQUFLLEVBQUU7UUFBRSxHQUFHL0IsTUFBTSxDQUFDaUIsT0FBTztFQUFFdkIsTUFBQUEsS0FBSyxFQUFFO0VBQVU7S0FBRSxlQUNsRFosc0JBQUEsQ0FBQUMsYUFBQSxDQUFBLE1BQUEsRUFBQTtNQUFNZ0QsS0FBSyxFQUFFL0IsTUFBTSxDQUFDbUI7S0FBVyxFQUFDLEdBQU8sQ0FBQyxlQUN4Q3JDLHNCQUFBLENBQUFDLGFBQUEsQ0FBQSxNQUFBLEVBQUEsSUFBQSxFQUFNLHVCQUEyQixDQUM5QixDQUNOLEVBQ0FvRCxJQUFJLENBQUN5QixHQUFHLENBQUMsQ0FBQ0MsS0FBSyxFQUFFQyxDQUFDLGtCQUNqQmhGLHNCQUFBLENBQUFDLGFBQUEsQ0FBQzZDLFFBQVEsRUFBQTtFQUFDbUMsSUFBQUEsR0FBRyxFQUFFRCxDQUFFO0VBQUNqQyxJQUFBQSxLQUFLLEVBQUVpQyxDQUFFO0VBQUNwQyxJQUFBQSxJQUFJLEVBQUVtQztFQUFNLEdBQUUsQ0FDM0MsQ0FBQyxlQUNGL0Usc0JBQUEsQ0FBQUMsYUFBQSxDQUFBLEtBQUEsRUFBQTtFQUFLaUYsSUFBQUEsR0FBRyxFQUFFMUI7S0FBUyxDQUNoQixDQUNGLENBQ0YsQ0FBQztFQUVWLENBQUM7RUFFRCxNQUFNMkIsY0FBYyxHQUFHQSxNQUFNO0lBQzNCLE1BQU0sQ0FBQ0MsS0FBSyxFQUFFQyxRQUFRLENBQUMsR0FBR0MsY0FBUSxDQUFDLElBQUksQ0FBQztJQUN4QyxNQUFNLENBQUNDLE9BQU8sRUFBRUMsVUFBVSxDQUFDLEdBQUdGLGNBQVEsQ0FBQyxJQUFJLENBQUM7SUFDNUMsTUFBTSxDQUFDaEMsT0FBTyxFQUFFbUMsVUFBVSxDQUFDLEdBQUdILGNBQVEsQ0FBQyxLQUFLLENBQUM7SUFDN0MsTUFBTSxDQUFDSSxTQUFTLEVBQUVDLFlBQVksQ0FBQyxHQUFHTCxjQUFRLENBQUMsSUFBSSxDQUFDO0lBQ2hELE1BQU0sQ0FBQ00sV0FBVyxFQUFFQyxjQUFjLENBQUMsR0FBR1AsY0FBUSxDQUFDLElBQUksQ0FBQztJQUNwRCxNQUFNLENBQUNRLE9BQU8sRUFBRUMsVUFBVSxDQUFDLEdBQUdULGNBQVEsQ0FBQyxFQUFFLENBQUM7SUFDMUMsTUFBTSxDQUFDakMsSUFBSSxFQUFFMkMsT0FBTyxDQUFDLEdBQUdWLGNBQVEsQ0FBQyxFQUFFLENBQUM7SUFDcEMsTUFBTSxDQUFDVyxRQUFRLEVBQUVDLFdBQVcsQ0FBQyxHQUFHWixjQUFRLENBQUMsS0FBSyxDQUFDO0VBRS9DLEVBQUEsTUFBTWEsY0FBYyxHQUFHLFlBQVk7TUFDakMsSUFBSTtFQUNGLE1BQUEsTUFBTUMsR0FBRyxHQUFHLE1BQU1DLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQztFQUMvQyxNQUFBLElBQUksQ0FBQ0QsR0FBRyxDQUFDRSxFQUFFLEVBQUUsTUFBTSxJQUFJQyxLQUFLLENBQUMsQ0FBQSxLQUFBLEVBQVFILEdBQUcsQ0FBQ25GLE1BQU0sRUFBRSxDQUFDO0VBQ2xELE1BQUEsTUFBTXVGLElBQUksR0FBRyxNQUFNSixHQUFHLENBQUNLLElBQUksRUFBRTtRQUM3QnBCLFFBQVEsQ0FBQ21CLElBQUksQ0FBQztNQUNoQixDQUFDLENBQUMsT0FBT0UsR0FBRyxFQUFFO0VBQ1pDLE1BQUFBLE9BQU8sQ0FBQ0MsS0FBSyxDQUFDLCtDQUErQyxFQUFFRixHQUFHLENBQUM7RUFDckUsSUFBQSxDQUFDLFNBQVM7UUFDUmxCLFVBQVUsQ0FBQyxLQUFLLENBQUM7RUFDbkIsSUFBQTtJQUNGLENBQUM7RUFFRCxFQUFBLE1BQU1xQixZQUFZLEdBQUcsWUFBWTtNQUMvQixJQUFJO0VBQ0YsTUFBQSxNQUFNVCxHQUFHLEdBQUcsTUFBTUMsS0FBSyxDQUFDLDhCQUE4QixDQUFDO0VBQ3ZELE1BQUEsSUFBSSxDQUFDRCxHQUFHLENBQUNFLEVBQUUsRUFBRTtFQUNiLE1BQUEsTUFBTUUsSUFBSSxHQUFHLE1BQU1KLEdBQUcsQ0FBQ0ssSUFBSSxFQUFFO1FBQzdCLElBQUlELElBQUksQ0FBQ1YsT0FBTyxFQUFFQyxVQUFVLENBQUNTLElBQUksQ0FBQ1YsT0FBTyxDQUFDO01BQzVDLENBQUMsQ0FBQyxPQUFPWSxHQUFHLEVBQUU7RUFDWjtFQUFBLElBQUE7SUFFSixDQUFDO0VBRURoRCxFQUFBQSxlQUFTLENBQUMsTUFBTTtFQUNkeUMsSUFBQUEsY0FBYyxFQUFFO0VBQ2hCVSxJQUFBQSxZQUFZLEVBQUU7SUFDaEIsQ0FBQyxFQUFFLEVBQUUsQ0FBQztFQUVOLEVBQUEsTUFBTUMsVUFBVSxHQUFHLFlBQVk7TUFDN0JyQixVQUFVLENBQUMsSUFBSSxDQUFDO01BQ2hCRSxZQUFZLENBQUMsSUFBSSxDQUFDO01BQ2xCRSxjQUFjLENBQUMsSUFBSSxDQUFDO01BQ3BCRyxPQUFPLENBQUMsRUFBRSxDQUFDO01BQ1hFLFdBQVcsQ0FBQyxLQUFLLENBQUM7RUFDbEI5QixJQUFBQSxNQUFNLENBQUNDLFVBQVUsR0FBR0gsSUFBSSxDQUFDQyxHQUFHLEVBQUU7RUFFOUIsSUFBQSxNQUFNNEMsWUFBWSxHQUFHQyxXQUFXLENBQUMsWUFBWTtRQUMzQyxJQUFJO0VBQ0YsUUFBQSxNQUFNWixHQUFHLEdBQUcsTUFBTUMsS0FBSyxDQUFDLDJCQUEyQixDQUFDO1VBQ3BELElBQUlELEdBQUcsQ0FBQ0UsRUFBRSxFQUFFO0VBQ1YsVUFBQSxNQUFNRSxJQUFJLEdBQUcsTUFBTUosR0FBRyxDQUFDSyxJQUFJLEVBQUU7WUFDN0IsSUFBSUQsSUFBSSxDQUFDbkQsSUFBSSxFQUFFMkMsT0FBTyxDQUFDUSxJQUFJLENBQUNuRCxJQUFJLENBQUM7RUFDbkMsUUFBQTtFQUNGLE1BQUEsQ0FBQyxDQUFDLE9BQU80RCxDQUFDLEVBQUUsQ0FBQztNQUNmLENBQUMsRUFBRSxJQUFJLENBQUM7TUFFUixJQUFJO0VBQ0YsTUFBQSxNQUFNYixHQUFHLEdBQUcsTUFBTUMsS0FBSyxDQUFDLDRCQUE0QixDQUFDO0VBQ3JELE1BQUEsTUFBTWEsTUFBTSxHQUFHLE1BQU1kLEdBQUcsQ0FBQ0ssSUFBSSxFQUFFO0VBQy9CLE1BQUEsSUFBSSxDQUFDTCxHQUFHLENBQUNFLEVBQUUsRUFBRSxNQUFNLElBQUlDLEtBQUssQ0FBQ1csTUFBTSxDQUFDQyxPQUFPLElBQUksYUFBYSxDQUFDO1FBQzdEdEIsY0FBYyxDQUFDLHdDQUF3QyxDQUFDO0VBQ3hELE1BQUEsTUFBTXVCLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDLENBQUNsQixjQUFjLEVBQUUsRUFBRVUsWUFBWSxFQUFFLENBQUMsQ0FBQztNQUN2RCxDQUFDLENBQUMsT0FBT0gsR0FBRyxFQUFFO0VBQ1pmLE1BQUFBLFlBQVksQ0FBQ2UsR0FBRyxDQUFDUyxPQUFPLENBQUM7RUFDM0IsSUFBQSxDQUFDLFNBQVM7UUFDUkcsYUFBYSxDQUFDUCxZQUFZLENBQUM7UUFDM0J0QixVQUFVLENBQUMsS0FBSyxDQUFDO1FBQ2pCLElBQUk7RUFDRixRQUFBLE1BQU1XLEdBQUcsR0FBRyxNQUFNQyxLQUFLLENBQUMsMkJBQTJCLENBQUM7VUFDcEQsSUFBSUQsR0FBRyxDQUFDRSxFQUFFLEVBQUU7RUFDVixVQUFBLE1BQU1FLElBQUksR0FBRyxNQUFNSixHQUFHLENBQUNLLElBQUksRUFBRTtZQUM3QixJQUFJRCxJQUFJLENBQUNuRCxJQUFJLEVBQUUyQyxPQUFPLENBQUNRLElBQUksQ0FBQ25ELElBQUksQ0FBQztFQUNuQyxRQUFBO0VBQ0YsTUFBQSxDQUFDLENBQUMsT0FBTzRELENBQUMsRUFBRSxDQUFDO0VBQ2YsSUFBQTtJQUNGLENBQUM7RUFFRCxFQUFBLE1BQU1NLFVBQVUsR0FBRyxZQUFZO01BQzdCckIsV0FBVyxDQUFDLElBQUksQ0FBQztNQUNqQixJQUFJO0VBQ0YsTUFBQSxNQUFNRSxHQUFHLEdBQUcsTUFBTUMsS0FBSyxDQUFDLDJCQUEyQixDQUFDO0VBQ3BELE1BQUEsTUFBTUcsSUFBSSxHQUFHLE1BQU1KLEdBQUcsQ0FBQ0ssSUFBSSxFQUFFO0VBQzdCLE1BQUEsSUFBSSxDQUFDTCxHQUFHLENBQUNFLEVBQUUsRUFBRSxNQUFNLElBQUlDLEtBQUssQ0FBQ0MsSUFBSSxDQUFDVyxPQUFPLElBQUksZ0JBQWdCLENBQUM7TUFDaEUsQ0FBQyxDQUFDLE9BQU9ULEdBQUcsRUFBRTtFQUNaZixNQUFBQSxZQUFZLENBQUNlLEdBQUcsQ0FBQ1MsT0FBTyxDQUFDO0VBQzNCLElBQUEsQ0FBQyxTQUFTO1FBQ1JqQixXQUFXLENBQUMsS0FBSyxDQUFDO0VBQ3BCLElBQUE7SUFDRixDQUFDO0VBRUQsRUFBQSxJQUFJWCxPQUFPLEVBQUU7RUFDWCxJQUFBLG9CQUNFdkYsc0JBQUEsQ0FBQUMsYUFBQSxDQUFDQyxnQkFBRyxFQUFBO0VBQUNFLE1BQUFBLENBQUMsRUFBQyxLQUFLO1FBQUNDLElBQUksRUFBQSxJQUFBO0VBQUMwQixNQUFBQSxjQUFjLEVBQUMsUUFBUTtFQUFDekIsTUFBQUEsVUFBVSxFQUFDO0VBQVEsS0FBQSxlQUMzRE4sc0JBQUEsQ0FBQUMsYUFBQSxDQUFDdUgsbUJBQU0sRUFBQSxJQUFFLENBQ04sQ0FBQztFQUVWLEVBQUE7RUFFQSxFQUFBLE1BQU1DLFNBQVMsR0FBR3JDLEtBQUssRUFBRXNDLFNBQVMsRUFBRUQsU0FBUztFQUM3QyxFQUFBLE1BQU1FLE9BQU8sR0FBR3ZDLEtBQUssRUFBRXNDLFNBQVMsRUFBRUMsT0FBTztFQUV6QyxFQUFBLG9CQUNFM0gsc0JBQUEsQ0FBQUMsYUFBQSxDQUFDQyxnQkFBRyxFQUFBO0VBQUNFLElBQUFBLENBQUMsRUFBQztFQUFJLEdBQUEsZUFDVEosc0JBQUEsQ0FBQUMsYUFBQSxDQUFDQyxnQkFBRyxFQUFBO0VBQUN5RSxJQUFBQSxFQUFFLEVBQUM7RUFBSSxHQUFBLGVBQ1YzRSxzQkFBQSxDQUFBQyxhQUFBLENBQUMySCxlQUFFLEVBQUEsSUFBQSxFQUFDLFdBQWEsQ0FBQyxlQUNsQjVILHNCQUFBLENBQUFDLGFBQUEsQ0FBQ1ksaUJBQUksRUFBQTtFQUFDRCxJQUFBQSxLQUFLLEVBQUM7S0FBUSxFQUFDLDRCQUFnQyxDQUNsRCxDQUFDLGVBRU5aLHNCQUFBLENBQUFDLGFBQUEsQ0FBQ0MsZ0JBQUcsRUFBQTtNQUFDRyxJQUFJLEVBQUEsSUFBQTtFQUFDd0gsSUFBQUEsUUFBUSxFQUFDLE1BQU07RUFBQ3RILElBQUFBLEdBQUcsRUFBQyxJQUFJO0VBQUNvRSxJQUFBQSxFQUFFLEVBQUM7RUFBSyxHQUFBLGVBQ3pDM0Usc0JBQUEsQ0FBQUMsYUFBQSxDQUFDTCxRQUFRLEVBQUE7RUFBQ0MsSUFBQUEsS0FBSyxFQUFDLGFBQWE7RUFBQ0MsSUFBQUEsS0FBSyxFQUFFc0YsS0FBSyxFQUFFMEMsVUFBVSxJQUFJLENBQUU7RUFBQy9ILElBQUFBLElBQUksRUFBQztFQUFVLEdBQUUsQ0FBQyxlQUMvRUMsc0JBQUEsQ0FBQUMsYUFBQSxDQUFDTCxRQUFRLEVBQUE7RUFBQ0MsSUFBQUEsS0FBSyxFQUFDLGNBQWM7RUFBQ0MsSUFBQUEsS0FBSyxFQUFFc0YsS0FBSyxFQUFFMkMsV0FBVyxJQUFJLENBQUU7RUFBQ2hJLElBQUFBLElBQUksRUFBQztFQUFPLEdBQUUsQ0FBQyxlQUM5RUMsc0JBQUEsQ0FBQUMsYUFBQSxDQUFDTCxRQUFRLEVBQUE7RUFBQ0MsSUFBQUEsS0FBSyxFQUFDLE9BQU87RUFBQ0MsSUFBQUEsS0FBSyxFQUFFc0YsS0FBSyxFQUFFNEMsVUFBVSxJQUFJLENBQUU7RUFBQ2pJLElBQUFBLElBQUksRUFBQztFQUFNLEdBQUUsQ0FBQyxlQUNyRUMsc0JBQUEsQ0FBQUMsYUFBQSxDQUFDTCxRQUFRLEVBQUE7RUFBQ0MsSUFBQUEsS0FBSyxFQUFDLFlBQVk7RUFBQ0MsSUFBQUEsS0FBSyxFQUFFc0YsS0FBSyxFQUFFNkMsZUFBZSxJQUFJLENBQUU7RUFBQ2xJLElBQUFBLElBQUksRUFBQztFQUFRLEdBQUUsQ0FDN0UsQ0FBQyxlQUVOQyxzQkFBQSxDQUFBQyxhQUFBLENBQUNDLGdCQUFHLEVBQUE7RUFBQ3lFLElBQUFBLEVBQUUsRUFBQztFQUFLLEdBQUEsZUFDWDNFLHNCQUFBLENBQUFDLGFBQUEsQ0FBQ3lFLGVBQUUsRUFBQTtFQUFDQyxJQUFBQSxFQUFFLEVBQUM7RUFBSSxHQUFBLEVBQUMsZ0JBQWtCLENBQUMsZUFDL0IzRSxzQkFBQSxDQUFBQyxhQUFBLENBQUNDLGdCQUFHLEVBQUE7RUFBQ0MsSUFBQUEsT0FBTyxFQUFDLE1BQU07RUFBQ0MsSUFBQUEsQ0FBQyxFQUFDO0VBQUksR0FBQSxFQUN2QnVILE9BQU8sSUFBSSxDQUFDckUsT0FBTyxJQUFJLENBQUNtRSxTQUFTLGdCQUNoQ3pILHNCQUFBLENBQUFDLGFBQUEsQ0FBQ0MsZ0JBQUcsRUFBQTtFQUFDeUUsSUFBQUEsRUFBRSxFQUFDO0VBQUksR0FBQSxlQUNWM0Usc0JBQUEsQ0FBQUMsYUFBQSxDQUFDWSxpQkFBSSxFQUFBO0VBQUNDLElBQUFBLFVBQVUsRUFBQztFQUFNLEdBQUEsRUFBQyxXQUFlLENBQUMsZUFDeENkLHNCQUFBLENBQUFDLGFBQUEsQ0FBQ0MsZ0JBQUcsRUFBQTtFQUFDYSxJQUFBQSxFQUFFLEVBQUMsSUFBSTtNQUFDVixJQUFJLEVBQUEsSUFBQTtFQUFDQyxJQUFBQSxVQUFVLEVBQUMsUUFBUTtFQUFDQyxJQUFBQSxHQUFHLEVBQUM7RUFBSSxHQUFBLGVBQzVDUCxzQkFBQSxDQUFBQyxhQUFBLENBQUMyRSxrQkFBSyxFQUFBO0VBQUN6RSxJQUFBQSxPQUFPLEVBQUVhLGFBQWEsQ0FBQzJHLE9BQU8sQ0FBQzFHLE1BQU07S0FBRSxFQUFFMEcsT0FBTyxDQUFDMUcsTUFBYyxDQUFDLGVBQ3ZFakIsc0JBQUEsQ0FBQUMsYUFBQSxDQUFDWSxpQkFBSSxFQUFBO0VBQUNxSCxJQUFBQSxFQUFFLEVBQUMsTUFBTTtFQUFDMUcsSUFBQUEsUUFBUSxFQUFDO0VBQUksR0FBQSxFQUFFLElBQUkwQyxJQUFJLENBQUN5RCxPQUFPLENBQUNRLFNBQVMsQ0FBQyxDQUFDQyxjQUFjLEVBQVMsQ0FDL0UsQ0FBQyxlQUNOcEksc0JBQUEsQ0FBQUMsYUFBQSxDQUFDQyxnQkFBRyxFQUFBO0VBQUNhLElBQUFBLEVBQUUsRUFBQyxJQUFJO01BQUNWLElBQUksRUFBQSxJQUFBO0VBQUNFLElBQUFBLEdBQUcsRUFBQztFQUFLLEdBQUEsZUFDekJQLHNCQUFBLENBQUFDLGFBQUEsQ0FBQ1ksaUJBQUksRUFBQTtFQUFDVyxJQUFBQSxRQUFRLEVBQUM7RUFBSSxHQUFBLEVBQUMsWUFBVSxFQUFDbUcsT0FBTyxDQUFDVSxRQUFRLEVBQUMsSUFBUSxDQUFDLGVBQ3pEckksc0JBQUEsQ0FBQUMsYUFBQSxDQUFDWSxpQkFBSSxFQUFBO0VBQUNXLElBQUFBLFFBQVEsRUFBQztLQUFJLEVBQUMsY0FBWSxFQUFDbUcsT0FBTyxDQUFDVyxVQUFpQixDQUFDLGVBQzNEdEksc0JBQUEsQ0FBQUMsYUFBQSxDQUFDWSxpQkFBSSxFQUFBO0VBQUNXLElBQUFBLFFBQVEsRUFBQztLQUFJLEVBQUMsWUFBVSxFQUFDbUcsT0FBTyxDQUFDWSxRQUFlLENBQUMsZUFDdkR2SSxzQkFBQSxDQUFBQyxhQUFBLENBQUNZLGlCQUFJLEVBQUE7RUFBQ1csSUFBQUEsUUFBUSxFQUFDO0tBQUksRUFBQyxVQUFRLEVBQUNtRyxPQUFPLENBQUNhLE1BQWEsQ0FDL0MsQ0FDRixDQUFDLEdBQ0osSUFBSSxFQUVQLENBQUNiLE9BQU8sSUFBSSxDQUFDckUsT0FBTyxJQUFJLENBQUNtRSxTQUFTLGdCQUNqQ3pILHNCQUFBLENBQUFDLGFBQUEsQ0FBQ1ksaUJBQUksRUFBQTtFQUFDOEQsSUFBQUEsRUFBRSxFQUFDLElBQUk7RUFBQy9ELElBQUFBLEtBQUssRUFBQztLQUFRLEVBQUMsd0JBQTRCLENBQUMsR0FDeEQsSUFBSSxFQUVQOEUsU0FBUyxpQkFBSTFGLHNCQUFBLENBQUFDLGFBQUEsQ0FBQ0MsZ0JBQUcsRUFBQTtFQUFDeUUsSUFBQUEsRUFBRSxFQUFDO0VBQUksR0FBQSxlQUFDM0Usc0JBQUEsQ0FBQUMsYUFBQSxDQUFDWSxpQkFBSSxFQUFBO0VBQUNELElBQUFBLEtBQUssRUFBQztLQUFRLEVBQUU4RSxTQUFnQixDQUFNLENBQUMsRUFDdkVFLFdBQVcsaUJBQUk1RixzQkFBQSxDQUFBQyxhQUFBLENBQUNDLGdCQUFHLEVBQUE7RUFBQ3lFLElBQUFBLEVBQUUsRUFBQztFQUFJLEdBQUEsZUFBQzNFLHNCQUFBLENBQUFDLGFBQUEsQ0FBQ1ksaUJBQUksRUFBQTtFQUFDRCxJQUFBQSxLQUFLLEVBQUM7S0FBUyxFQUFFZ0YsV0FBa0IsQ0FBTSxDQUFDLGVBRTdFNUYsc0JBQUEsQ0FBQUMsYUFBQSxDQUFDQyxnQkFBRyxFQUFBO01BQUNHLElBQUksRUFBQSxJQUFBO0VBQUNFLElBQUFBLEdBQUcsRUFBQyxJQUFJO0VBQUNELElBQUFBLFVBQVUsRUFBQztFQUFRLEdBQUEsZUFDcENOLHNCQUFBLENBQUFDLGFBQUEsQ0FBQ3dJLG1CQUFNLEVBQUE7RUFDTHRJLElBQUFBLE9BQU8sRUFBQyxTQUFTO0VBQ2pCdUksSUFBQUEsT0FBTyxFQUFFNUIsVUFBVztNQUNwQjZCLFFBQVEsRUFBRXJGLE9BQU8sSUFBSW1FO0tBQVUsRUFFOUJuRSxPQUFPLEdBQUcsWUFBWSxHQUFHbUUsU0FBUyxHQUFHLHFCQUFxQixHQUFHLFVBQ3hELENBQUMsRUFDUixDQUFDbkUsT0FBTyxJQUFJbUUsU0FBUyxrQkFDcEJ6SCxzQkFBQSxDQUFBQyxhQUFBLENBQUN3SSxtQkFBTSxFQUFBO0VBQ0x0SSxJQUFBQSxPQUFPLEVBQUMsUUFBUTtFQUNoQnVJLElBQUFBLE9BQU8sRUFBRW5CLFVBQVc7RUFDcEJvQixJQUFBQSxRQUFRLEVBQUUxQztLQUFTLEVBRWxCQSxRQUFRLEdBQUcsYUFBYSxHQUFHLFdBQ3RCLENBRVAsQ0FBQyxFQUVMLENBQUMzQyxPQUFPLElBQUltRSxTQUFTLElBQUlwRSxJQUFJLENBQUN3QixNQUFNLEdBQUcsQ0FBQyxrQkFDdkM3RSxzQkFBQSxDQUFBQyxhQUFBLENBQUNtRCxTQUFTLEVBQUE7RUFBQ0MsSUFBQUEsSUFBSSxFQUFFQSxJQUFLO0VBQUNDLElBQUFBLE9BQU8sRUFBRUEsT0FBUTtFQUFDQyxJQUFBQSxPQUFPLEVBQUVrRTtLQUFZLENBRTdELENBQ0YsQ0FBQyxFQUVMM0IsT0FBTyxDQUFDakIsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDdkIsT0FBTyxJQUFJLENBQUNtRSxTQUFTLGlCQUMzQ3pILHNCQUFBLENBQUFDLGFBQUEsQ0FBQ0MsZ0JBQUcsRUFBQSxJQUFBLGVBQ0ZGLHNCQUFBLENBQUFDLGFBQUEsQ0FBQ3lFLGVBQUUsRUFBQTtFQUFDQyxJQUFBQSxFQUFFLEVBQUM7RUFBSSxHQUFBLEVBQUMscUJBQW1CLEVBQUNtQixPQUFPLENBQUNqQixNQUFNLEVBQUMsR0FBSyxDQUFDLGVBQ3JEN0Usc0JBQUEsQ0FBQUMsYUFBQSxDQUFDMkksa0JBQUssRUFBQSxJQUFBLGVBQ0o1SSxzQkFBQSxDQUFBQyxhQUFBLENBQUM0SSxzQkFBUyxxQkFDUjdJLHNCQUFBLENBQUFDLGFBQUEsQ0FBQzZJLHFCQUFRLEVBQUEsSUFBQSxlQUNQOUksc0JBQUEsQ0FBQUMsYUFBQSxDQUFDOEksc0JBQVMsRUFBQSxJQUFBLGVBQUMvSSxzQkFBQSxDQUFBQyxhQUFBLENBQUNZLGlCQUFJLEVBQUE7RUFBQ0MsSUFBQUEsVUFBVSxFQUFDO0VBQU0sR0FBQSxFQUFDLFNBQWEsQ0FBWSxDQUFDLGVBQzdEZCxzQkFBQSxDQUFBQyxhQUFBLENBQUM4SSxzQkFBUyxFQUFBLElBQUEsZUFBQy9JLHNCQUFBLENBQUFDLGFBQUEsQ0FBQ1ksaUJBQUksRUFBQTtFQUFDQyxJQUFBQSxVQUFVLEVBQUM7RUFBTSxHQUFBLEVBQUMsUUFBWSxDQUFZLENBQUMsZUFDNURkLHNCQUFBLENBQUFDLGFBQUEsQ0FBQzhJLHNCQUFTLEVBQUEsSUFBQSxlQUFDL0ksc0JBQUEsQ0FBQUMsYUFBQSxDQUFDWSxpQkFBSSxFQUFBO0VBQUNDLElBQUFBLFVBQVUsRUFBQztFQUFNLEdBQUEsRUFBQyxZQUFnQixDQUFZLENBQUMsZUFDaEVkLHNCQUFBLENBQUFDLGFBQUEsQ0FBQzhJLHNCQUFTLEVBQUEsSUFBQSxlQUFDL0ksc0JBQUEsQ0FBQUMsYUFBQSxDQUFDWSxpQkFBSSxFQUFBO0VBQUNDLElBQUFBLFVBQVUsRUFBQztFQUFNLEdBQUEsRUFBQyxVQUFjLENBQVksQ0FBQyxlQUM5RGQsc0JBQUEsQ0FBQUMsYUFBQSxDQUFDOEksc0JBQVMsRUFBQSxJQUFBLGVBQUMvSSxzQkFBQSxDQUFBQyxhQUFBLENBQUNZLGlCQUFJLEVBQUE7RUFBQ0MsSUFBQUEsVUFBVSxFQUFDO0VBQU0sR0FBQSxFQUFDLFFBQVksQ0FBWSxDQUFDLGVBQzVEZCxzQkFBQSxDQUFBQyxhQUFBLENBQUM4SSxzQkFBUyxFQUFBLElBQUEsZUFBQy9JLHNCQUFBLENBQUFDLGFBQUEsQ0FBQ1ksaUJBQUksRUFBQTtFQUFDQyxJQUFBQSxVQUFVLEVBQUM7S0FBTSxFQUFDLFVBQWMsQ0FBWSxDQUNyRCxDQUNELENBQUMsZUFDWmQsc0JBQUEsQ0FBQUMsYUFBQSxDQUFDK0ksc0JBQVMsUUFDUGxELE9BQU8sQ0FBQ2hCLEdBQUcsQ0FBQ21FLEdBQUcsaUJBQ2RqSixzQkFBQSxDQUFBQyxhQUFBLENBQUM2SSxxQkFBUSxFQUFBO01BQUM3RCxHQUFHLEVBQUVnRSxHQUFHLENBQUNDO0VBQUksR0FBQSxlQUNyQmxKLHNCQUFBLENBQUFDLGFBQUEsQ0FBQzhJLHNCQUFTLEVBQUEsSUFBQSxFQUFFLElBQUk3RSxJQUFJLENBQUMrRSxHQUFHLENBQUNkLFNBQVMsQ0FBQyxDQUFDQyxjQUFjLEVBQWMsQ0FBQyxlQUNqRXBJLHNCQUFBLENBQUFDLGFBQUEsQ0FBQzhJLHNCQUFTLEVBQUEsSUFBQSxlQUFDL0ksc0JBQUEsQ0FBQUMsYUFBQSxDQUFDMkUsa0JBQUssRUFBQTtFQUFDekUsSUFBQUEsT0FBTyxFQUFFYSxhQUFhLENBQUNpSSxHQUFHLENBQUNoSSxNQUFNO0VBQUUsR0FBQSxFQUFFZ0ksR0FBRyxDQUFDaEksTUFBYyxDQUFZLENBQUMsZUFDdEZqQixzQkFBQSxDQUFBQyxhQUFBLENBQUM4SSxzQkFBUyxFQUFBLElBQUEsRUFBRUUsR0FBRyxDQUFDWCxVQUFVLElBQUksQ0FBYSxDQUFDLGVBQzVDdEksc0JBQUEsQ0FBQUMsYUFBQSxDQUFDOEksc0JBQVMsRUFBQSxJQUFBLEVBQUVFLEdBQUcsQ0FBQ1YsUUFBUSxJQUFJLENBQWEsQ0FBQyxlQUMxQ3ZJLHNCQUFBLENBQUFDLGFBQUEsQ0FBQzhJLHNCQUFTLEVBQUEsSUFBQSxFQUFFRSxHQUFHLENBQUNULE1BQU0sSUFBSSxDQUFhLENBQUMsZUFDeEN4SSxzQkFBQSxDQUFBQyxhQUFBLENBQUM4SSxzQkFBUyxFQUFBLElBQUEsRUFBRUUsR0FBRyxDQUFDWixRQUFRLEdBQUcsQ0FBQSxFQUFHWSxHQUFHLENBQUNaLFFBQVEsQ0FBQSxFQUFBLENBQUksR0FBRyxHQUFlLENBQ3hELENBQ1gsQ0FDUSxDQUNOLENBQ0osQ0FFSixDQUFDO0VBRVYsQ0FBQzs7RUMxVkRjLE9BQU8sQ0FBQ0MsY0FBYyxHQUFHLEVBQUU7RUFFM0JELE9BQU8sQ0FBQ0MsY0FBYyxDQUFDakUsY0FBYyxHQUFHQSxjQUFjOzs7Ozs7In0=
