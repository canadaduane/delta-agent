export default function logSwarmEvents(swarm, log) {
  const attach = (event, details = {}) => {
    log("attaching swarm event ", event);
    swarm.on(event, details => {
      log(`swarm: ${event}`, details);
    });
  };

  attach("peer");
  attach("peer-banned");
  attach("peer-rejected");
  attach("drop");
  attach("connecting");
  attach("connect-failed");
  attach("handshaking");
  attach("handshake-timeout");
  attach("connection");
  attach("connection-closed");
  attach("redundant-connection");
}
