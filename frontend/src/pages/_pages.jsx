// pages/_error.js
import { useRouter } from 'next/router';
import { useEffect } from 'react';

function Error({ statusCode }) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page if route not found
    if (statusCode === 404) {
      router.push('/');
    }
  }, [statusCode]);

  return null;
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;