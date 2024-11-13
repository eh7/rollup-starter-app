// @ts-check
import { mplex } from '@libp2p/mplex'
//
import { createLibp2p } from 'libp2p'
import { autoNAT } from '@libp2p/autonat'
import { identify } from '@libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { multiaddr } from '@multiformats/multiaddr'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { webSockets } from '@libp2p/websockets'
import * as filters from '@libp2p/websockets/filters'
import { webRTC, webRTCDirect } from '@libp2p/webrtc'
import { tcp } from '@libp2p/tcp'
import { enable, disable } from '@libp2p/logger'
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'
import { update, getPeerTypes, getAddresses, getPeerDetails } from './utils.js'
import { bootstrap } from '@libp2p/bootstrap'
import { circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { PUBSUB_PEER_DISCOVERY } from './constants.js'

async function main() {
  // enable('*')
  const libp2p = await createLibp2p({
    addresses: {
      listen: [
//        '/ip4/0.0.0.0/tcp/9003/ws',
//        '/ip4/0.0.0.0/tcp/9004',
//        '/ip4/127.0.0.1/tcp/9001/ws',
//        '/ip4/127.0.0.1/tcp/9002',
        '/ip4/0.0.0.0/tcp/9001/ws',
        '/ip4/0.0.0.0/tcp/9002',
      ],
    },
    transports: [
      webSockets({
        filter: filters.all, // Connect to all TCP and DNS-based addresses
      }),
      //webSockets(),
      tcp(),
    ],
    connectionEncryption: [noise()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    connectionGater: {
      // Allow private addresses for local testing
      denyDialMultiaddr: async () => false,
    },
    services: {
      identify: identify(),
      autoNat: autoNAT(),
      relay: circuitRelayServer(),
      pubsub: gossipsub(),
    },
  })

  libp2p.services.pubsub.subscribe(PUBSUB_PEER_DISCOVERY)

  console.log('PeerID: ', libp2p.peerId.toString())
  console.log('Multiaddrs: ', libp2p.getMultiaddrs())
}

main()
