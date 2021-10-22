const Core = require('./index');

const main = async () => {
  const node = await Core({});

  if (process.env.N === 'client') {
    await node.request({
      dest: process?.env?.Feed || '',
      message: 'lol',
    });
  } else {
    const feed = node.listen();
    node.listen();
    node.listen();

    await feed.ready();
    console.log(feed, feed.key.toString('hex'));
  }
};

main();
