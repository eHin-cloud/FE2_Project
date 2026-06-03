const http = require('http');

http.get('http://127.0.0.1:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const targets = JSON.parse(data);
      console.log('Targets:', targets);
      const pageTarget = targets.find(t => t.type === 'page');
      if (!pageTarget) {
        console.error('No page target found!');
        process.exit(1);
      }
      
      const wsUrl = pageTarget.webSocketDebuggerUrl;
      console.log('Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        console.log('WebSocket connected!');
        // Enable Console and Runtime domains
        ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 3, method: 'Log.enable' }));
      };
      
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          const args = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
          console.log(`[BROWSER CONSOLE] [${msg.params.type}] ${args}`);
        } else if (msg.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails.exception.description);
        }
      };
      
      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
      
      setTimeout(() => {
        console.log('Closing debug script...');
        ws.close();
        process.exit(0);
      }, 5000);
      
    } catch (e) {
      console.error('Parsing error:', e);
      process.exit(1);
    }
  });
});
