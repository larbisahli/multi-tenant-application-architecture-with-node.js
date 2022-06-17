import express, { Application } from 'express';
import routes from './routes/index';

const app: Application = express();

app.set('trust proxy', true);

app.disable('x-powered-by');

// Routes
app.use('/', routes);

const PORT = 5000;

const server = app.listen(PORT, function () {
  console.log(`Express Server started on port ${PORT}`);
});

export default server;