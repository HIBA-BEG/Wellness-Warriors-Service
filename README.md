# 🏅 Wellness Warriors - Service

## 👩🏻‍💻 Project Presentation
[Wellness Warriors Presentation HERE](https://www.canva.com/design/DAGX5mRxzho/EUheX8EtAlBNKnvmSsvz7Q/edit?utm_content=DAGX5mRxzho&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

## 📋 Project Overview
Backend service for sports event registration management, providing robust API endpoints for event and participant management..

## 🚀 Features

- Event CRUD operations
- Participant registration management
- JWT Authentication
- Role-based authorization
- Unit testing for controllers

## 🛠 Technology Stack

- NestJS
- MongoDB (Mongoose ODM)
- JWT Authentication
- Jest (Unit Testing)

## 🔧 Prerequisites

- Node.js (v18+)
- MongoDB
- npm 

## 📦 Installation

1- Clone the repository

bash
```
git clone https://github.com/HIBA-BEG/Wellness-Warriors-Service.git
```

2- Install dependencies

bash
```
npm install
```

3- Create .env file

```
MONGODB_URI=mongodb://localhost:27017/WellnessWarriors
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

## 🖥 Available Scripts

- ```npm run start``` : Production server
- ```npm run start:dev``` : Development server
- ```npm run build``` : Compile TypeScript
- ```npm run test``` : Run unit tests
- ```npm run lint``` : Run linter

## 🔐 Authentication

JWT-based authentication
Role-based authorization
Secure route protection

## 🧪 Testing

- Jest for unit testing
- Controller test coverage
- Comprehensive test suites

## 🚢 Deployment
### Docker Deployment

1- Build Docker images

bash
```
docker-compose build
```

2- Run containers

bash
```
docker-compose up
```

## 📄 API Endpoints

- ```/event``` : Event management
- ```/participants```: Participant registration
- ```/auth```: Authentication routes

## 🛠 Troubleshooting

- Verify MongoDB connection
- Check .env configuration
- Review server logs

## 📞 Contact

- BEGHDI HIBA
- beghiba@gmail.com
- Client Link (Front-end) : https://github.com/HIBA-BEG/Wellness-Warriors-Client.git
