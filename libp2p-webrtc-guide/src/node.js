// @ts-check
import { createLibp2p } from 'libp2p'
import { identify } from '@libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { multiaddr } from '@multiformats/multiaddr'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { webSockets } from '@libp2p/websockets'
import { webTransport } from '@libp2p/webtransport'
import { webRTC, webRTCDirect } from '@libp2p/webrtc'
import { circuitRelayTransport, circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { enable, disable } from '@libp2p/logger'
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'
import { PUBSUB_PEER_DISCOVERY } from './constants.js'
import { update, getPeerTypes, getAddresses, getPeerDetails } from './utils.js'
import { bootstrap } from '@libp2p/bootstrap'
import * as filters from '@libp2p/websockets/filters'

import { fromString as uint8ArrayFromString } from "uint8arrays/from-string"
import { toString as uint8ArrayToString } from "uint8arrays/to-string"

import { createFromProtobuf } from '@libp2p/peer-id-factory'
import { peerIds } from './peers.js'

const App = async () => {

  const peerId = await createFromProtobuf(
    Buffer.from(peerIds[1], 'hex')
  )

  const libp2p = await createLibp2p({
    peerId,
    addresses: {
      listen: [
        // 👇 Listen for webRTC connection
        '/webrtc',
      ],
    },
    transports: [
      webSockets({
        // Allow all WebSocket connections inclusing without TLS
        filter: filters.all,
      }),
      webTransport(),
      webRTC(),
      // 👇 Required to create circuit relay reservations in order to hole punch browser-to-browser WebRTC connections
      circuitRelayTransport({
        discoverRelays: 1,
      }),
    ],
    connectionEncryption: [noise()],
    streamMuxers: [yamux()],
    connectionGater: {
      // Allow private addresses for local testing
      denyDialMultiaddr: async () => false,
    },
    peerDiscovery: [
      bootstrap({
        list: ['/ip4/127.0.0.1/tcp/9001/ws/p2p/12D3KooWATM3WBM9SaBmf88B57Msggrui7tarypMmcca72cUD4ed'],
      }),
      pubsubPeerDiscovery({
        interval: 10_000,
        topics: [PUBSUB_PEER_DISCOVERY],
      }),
    ],
    services: {
      pubsub: gossipsub(),
      identify: identify(),
    },
  })

  globalThis.libp2p = libp2p

  libp2p.addEventListener('peer:connect', (event) => {
    const remotePeer = event.detail
    console.log('connect:', remotePeer.toString())
  })

  libp2p.addEventListener('peer:disconnect', (event) => {
    const remotePeer = event.detail
    //console.log('disconnect:', event)
    console.log('disconnect:', remotePeer.toString())
  })

  libp2p.addEventListener('peer:discovery', (event) => {
    const remotePeer = event.detail.id
    console.log('Discovered:', remotePeer.toString())
    //console.log('Discovered:', evt.detail.id.toString())
  })

  const topic = "welcome_0.0.1"

  libp2p.services.pubsub.addEventListener("message", (evt) => {
    if (evt.detail.topic != 'browser-peer-discovery') {
      console.log(
        "*********** received: ",
        evt.detail,
        evt.detail.data,
        evt.detail.topic,
      )
    }
    //console.log(`received: ${uint8ArrayToString(evt.detail.data)} on topic ${evt.detail.topic}`)
  })
  await libp2p.services.pubsub.subscribe(topic)

  libp2p.addEventListener('self:peer:update', () => {
    //console.log('xxxxx', libp2p.getMultiaddrs())
    const multiaddrs = libp2p.getMultiaddrs()
    console.log("listeningAddressesList: ", multiaddrs)
  })

  setInterval(() => {
    console.log('DOM.nodePeerCount()', libp2p.getConnections().length)
    console.log("libp2p.getConnections::", libp2p
      .getConnections()
      .map((conn) => conn.remoteAddr)
    )
//    console.log('DOM.nodeAddress', libp2p.getMultiaddrs())
    console.log('DOM.nodeAddressCount()', libp2p.getMultiaddrs().length)

//    console.log('DOM.nodeAddress', libp2p.getMultiaddrs())
    console.log("Peers :: ", libp2p
      .getPeers()
      .length
    )

    console.log("PeerId :: ", libp2p.peerId.toString())

//    console.log('DOM.nodePeerTypes()', getPeerTypes(libp2p))
//    console.log('DOM.nodeAddressCount()', libp2p.getMultiaddrs().length)
//    console.log('DOM.nodeAddresses()', getAddresses(libp2p))
//    console.log('DOM.nodePeerDetails()', getPeerDetails(libp2p))
  }, 5000)

/*
  const DOM = {
    nodePeerId: () => document.getElementById('output-node-peer-id'),
    nodeStatus: () => document.getElementById('output-node-status'),
    nodePeerCount: () => document.getElementById('output-peer-count'),
    nodePeerTypes: () => document.getElementById('output-peer-types'),
    nodePeerDetails: () => document.getElementById('output-peer-details'),
    nodeAddressCount: () => document.getElementById('output-address-count'),
    nodeAddresses: () => document.getElementById('output-addresses'),

    inputMultiaddr: () => document.getElementById('input-multiaddr'),
    connectButton: () => document.getElementById('button-connect'),
    loggingButtonEnable: () => document.getElementById('button-logging-enable'),
    loggingButtonDisable: () => document.getElementById('button-logging-disable'),
    outputQuery: () => document.getElementById('output'),
  }

  update(DOM.nodePeerId(), libp2p.peerId.toString())
  update(DOM.nodeStatus(), 'Online')

  libp2p.addEventListener('peer:connect', (event) => {})
  libp2p.addEventListener('peer:disconnect', (event) => {})

  setInterval(() => {
    update(DOM.nodePeerCount(), libp2p.getConnections().length)
    update(DOM.nodePeerTypes(), getPeerTypes(libp2p))
    update(DOM.nodeAddressCount(), libp2p.getMultiaddrs().length)
    update(DOM.nodeAddresses(), getAddresses(libp2p))
    update(DOM.nodePeerDetails(), getPeerDetails(libp2p))
  }, 1000)

  DOM.loggingButtonEnable().onclick = (e) => {
    enable('*,*:debug')
  }
  DOM.loggingButtonDisable().onclick = (e) => {
    disable()
  }

  DOM.connectButton().onclick = async (e) => {
    e.preventDefault()
    let maddr = multiaddr(DOM.inputMultiaddr().value)

    console.log(maddr)
    try {
      await libp2p.dial(maddr)
    } catch (e) {
      console.log(e)
    }
  }
*/
}

App().catch((err) => {
  console.error(err) // eslint-disable-line no-console
})
