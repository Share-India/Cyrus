## 1. Prepare GitHub Repository
Your local repository is already linked to: `https://github.com/adityaladge/weightedunderwritingmodel.git`

Run the following commands to commit your work and push:

```bash
git add .
git commit -m "Final Update: Cloud Saving, Sticky Nav, and Master Schema"
git push -u origin main
```


## 2. Deploy to Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and import the `weightedunderwritingmodel` repository.
3. In the **Environment Variables** section, add the following from your local `.env.local` file:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | *Your Supabase Project URL* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Your Supabase Anon Key* |

4. Click **Deploy**.

## 3. Finalize Supabase Configuration
Ensure you have run the [master_consolidated_setup.sql](./master_consolidated_setup.sql) script in your Supabase SQL Editor to set up the tables and security policies.

### Important Note on Redirects
After deployment, add your Vercel URL (e.g., `https://your-app.vercel.app/auth/callback`) to the **Redirect URLs** in your Supabase Auth settings:
`Supabase Dashboard > Authentication > URL Configuration > Redirect URLs`
