const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const repoName =
  process.env.GITHUB_REPOSITORY?.replace(/.*?\//, '') || 'My-Transaction';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: isGithubActions ? `/${repoName}` : '',
  assetPrefix: isGithubActions ? `/${repoName}/` : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
