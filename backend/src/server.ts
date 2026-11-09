import dotenv from 'dotenv';
import { app } from './app';

dotenv.config();

const PORT = Number(process.env.PORT) || 3333;

app.listen(PORT, () => {
  console.log(`=============================================================`);
  console.log(`🚀 HoraCerta Backend rodando em: http://localhost:${PORT}`);
  console.log(`📚 Documentação de rotas:        http://localhost:${PORT}/`);
  console.log(`=============================================================`);
});
