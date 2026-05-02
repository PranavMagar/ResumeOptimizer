import app from './app';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(
    JSON.stringify({
      message: `AI Resume Optimizer backend running on port ${PORT}`,
      port: PORT,
      timestamp: new Date().toISOString(),
    }),
  );
});
