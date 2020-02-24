const mock = () => ({
  crashFreeUsersPercent: Math.floor(Math.random() * 100),
  crashFreeUsersSessionsPercent: Math.floor(Math.random() * 100),
  crashes: Math.floor(Math.random() * 10000),
  errors: Math.floor(Math.random() * 10000),
  dailyActiveUsers: Math.floor(Math.random() * 100),
  graphData: {
    '24h': [
      [1578996000, 2718],
      [1578999600, 3555],
      [1579003200, 3787],
      [1579006800, 4480],
      [1579010400, 4961],
      [1579014000, 5067],
      [1579017600, 4443],
      [1579021200, 3311],
      [1579024800, 3226],
      [1579028400, 3065],
      [1579032000, 3181],
      [1579035600, 3216],
      [1579039200, 2859],
      [1579042800, 3670],
      [1579046400, 3643],
      [1579050000, 3571],
      [1579053600, 3715],
      [1579057200, 3686],
      [1579060800, 2655],
      [1579064400, 2310],
      [1579068000, 2030],
      [1579071600, 1925],
      [1579075200, 2218],
      [1579078800, 1136],
    ],
  } as any,
});

export const mockData = [...Array(20)].map(mock);
