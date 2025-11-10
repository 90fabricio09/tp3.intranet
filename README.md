# Intranet Administrativa - Imóveis Viseu 🔐

Painel administrativo para gestão de imóveis.

## 🚀 Início Rápido

```bash
npm install
npm run dev
```

Acesse: `http://localhost:5174`

## 🔑 Login

- Acesso apenas com usuários criados no Firebase Authentication
- Email e senha configurados no Firebase Console
- Sistema de recuperação de senha via email

## 📋 Funcionalidades

### Gestão de Imóveis (CRUD)

- ✅ **Criar** - Adicionar novos imóveis
- ✅ **Ler** - Visualizar todos os imóveis
- ✅ **Atualizar** - Editar informações
- ✅ **Deletar** - Remover imóveis

### Campos Gerenciados

- Nome do imóvel
- Descrição completa
- Região/Localização
- Tipo (Venda ou Aluguel)
- Preço em euros
- Número de quartos
- Número de banheiros
- Área em m²
- URL da imagem

## 👥 Criar Usuários

No [Firebase Console](https://console.firebase.google.com/):

1. Authentication > Users
2. Add user
3. Digite email e senha
4. O usuário poderá fazer login

## ⚙️ Configuração

1. Configure o Firebase em `src/firebase.js`
2. Adicione suas credenciais do Firebase Console
3. Configure Authentication (Email/Password)
4. Configure Firestore com as regras adequadas

## 🔒 Segurança

- Autenticação obrigatória
- Redirecionamento automático para login
- Logout seguro
- Recuperação de senha por email

## 📦 Build para Produção

```bash
npm run build
```

Os arquivos compilados estarão em `dist/`

## 🛡️ Regras do Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /imoveis/{imovel} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
