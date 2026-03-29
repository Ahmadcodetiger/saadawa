import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import axios, { AxiosInstance } from 'axios';
import { User } from '../../src/models/user.model.js';

let mongoServer: MongoMemoryServer;

export const setupTestDB = async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to in-memory database
    await mongoose.connect(mongoUri);
    
    return {
        clearDB: async () => {
            const collections = mongoose.connection.collections;
            for (const key in collections) {
                const collection = collections[key];
                await collection.deleteMany({});
            }
        },
        closeDB: async () => {
            await mongoose.disconnect();
            await mongoServer.stop();
        }
    };
};

export class TestClient {
    private axios: AxiosInstance;
    private token: string | null = null;
    
    constructor() {
        this.axios = axios.create({
            baseURL: `http://localhost:${process.env.PORT || 8000}/api`,
            validateStatus: () => true, // Don't throw on error status codes
        });
    }

    setToken(token: string) {
        this.token = token;
        this.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    async post(url: string, data: any) {
        return await this.axios.post(url, data);
    }

    async get(url: string) {
        return await this.axios.get(url);
    }

    async login(credentials: { email: string; password: 'password123' }) {
        const res = await this.post('/auth/login', credentials);
        if (res.data.token) {
            this.setToken(res.data.token);
        }
        return res;
    }
}

export const createTestUser = async (client: TestClient, userData: any) => {
    const res = await client.post('/auth/register', {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password: userData.password,
        phone_number: userData.phone,
        pin: '1234'
    });
    
    if (res.status !== 201) {
        throw new Error(`Failed to create test user: ${JSON.stringify(res.data)}`);
    }
    
    return res.data.user;
};
