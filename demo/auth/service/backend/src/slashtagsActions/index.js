const Slashtags = require('./core.js');

const Slashtags = ({ keyPair, metadata }) => {};

const SlashActs = ({ client }) => {
  return {};
};

const slashActs = SlashActs({
  client: slash,
  config: {
    ACT_1: {
      callbacks: {
        onInitialResponse,
        onVerifiedByServer,
        onVerifiedUser,
        onError,
      },
    },
  },
});

// when you get a URL
await slashActs.request(url);
