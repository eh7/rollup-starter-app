/* 1 eslint-disable no-console */

import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { identify } from '@libp2p/identify'
import { mplex } from '@libp2p/mplex'
import { webSockets } from '@libp2p/websockets'
import * as filters from '@libp2p/websockets/filters'
import { createLibp2p } from 'libp2p'

const server = await createLibp2p({
  addresses: {
    listen: ['/ip4/127.0.0.1/tcp/0/ws']
  },
  transports: [
    webSockets({
      filter: filters.all
    })
  ],
  connectionEncryption: [noise()],
  streamMuxers: [yamux(), mplex()],
  services: {
    identify: identify(),
    relay: circuitRelayServer({
      reservations: {
        maxReservations: Infinity
      }
    })
  },
  connectionManager: {
    minConnections: 0
  }
})

server.addEventListener('connection:open', (event) => {
  const { peer, stream, timeline } = event
  //console.log(`Peer connected: ${peer}`)
  //console.log(`Peer connected: ${peer.id}`)
  //console.log(`Streams: ${stream.map((s) => s.protocol)}`)
  //console.log(`Connection timeline: ${JSON.stringify(timeline)}`)
  console.log('connection:open', event)
  //updatePeerList()
})
server.addEventListener('connection:close', (event) => {
  const { peer, stream, timeline } = event
  //console.log(`Peer closed: ${peer.id}`)
  //console.log(`Streams: ${stream.map((s) => s.protocol)}`)
  //console.log(`Connection timeline: ${JSON.stringify(timeline)}`)
  console.log('connection:close')
  //updatePeerList()
})


console.log('Relay listening on multiaddr(s): ', server.getMultiaddrs().map((ma) => ma.toString()))
