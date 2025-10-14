export async function handleSignup(email: string, name: string, password: string): Promise<any> {
    const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'An error occurred during signup');
    }

    return await res.json();
}