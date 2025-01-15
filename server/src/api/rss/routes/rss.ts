export default {
  routes: [
    {
     method: 'GET',
     path: '/rss.xml',
     handler: 'rss.generateRss',
     config: {
       policies: [],
       middlewares: [],
     },
    },
  ],
};
