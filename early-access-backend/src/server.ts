import app from './app';

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Early Access Backend running on port ${PORT}`);
});
