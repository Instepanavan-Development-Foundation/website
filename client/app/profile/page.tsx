"use client";

import { useEffect, useState } from "react";

export default function MyProfile() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const jwt = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
            if (!jwt) {
                window.location.replace("/");
                return;
            }
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me?populate=*`, {
                    headers: { Authorization: `Bearer ${jwt}` },
                });
                const data = await res.json();

                setUser(data);
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    if (loading) {
        return <div>Բեռնվում է...</div>
    }


    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg flex flex-col gap-6">
            <h1 className="text-2xl font-bold mb-4">Իմ պրոֆիլը</h1>
            <div><b>Էլ. հասցե:</b> {user.email}</div>
            <div><b>Օգտանուն:</b> {user.username}</div>
        </div>
    );
}