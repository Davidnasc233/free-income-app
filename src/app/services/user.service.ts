import { Injectable } from "@angular/core";
import { User } from "../shared/interfaces/users.interface";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase.config";

@Injectable({
    providedIn: 'root'
})
export class UserService {
    async register(uid: string, user: User) {
        try {
            const newUser = doc(db, 'users', uid);

            await setDoc(newUser, {
                name: user.name,
                email: user.email,
                age: user.age,
                phone: user.phone,
                salary: user.salary,
                created_at: new Date().toISOString(),
                updated_at: null
            });
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            throw error
        }
    }

    async getUser(uid: string): Promise<User | null> {
        try {
            const usuarioRef = doc(db, 'users', uid);
            const docSnap = await getDoc(usuarioRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as User;
            }
            return null;

        } catch (error) {
            console.error('Erro ao buscar perfil do usuário:', error);
            throw error;
        }
    }
}