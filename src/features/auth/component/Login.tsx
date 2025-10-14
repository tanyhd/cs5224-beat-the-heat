export async function handleLogin(email: string, password: string): Promise<any> {
   const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
   });

   if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'An error occurred during login');
   }

   return await res.json();
}