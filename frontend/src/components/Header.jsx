import { Box, Button,  Typography, Link, Chip } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import logo from '../../public/assets/logo.png';
import { useAuth } from '@/context/AuthContext';

const Header = () => {
  const { currentFile } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
        <Link href="/" passHref>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              component="img"
              src={logo}
              alt="Logo"
              sx={{ height: 32, width: 'auto' }}
            />
          </Box>
        </Link>
        </div>
        
        {currentFile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              href={currentFile.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                textTransform: 'none',
                borderWidth: '1.5px',
                '&:hover': {
                  borderWidth: '1.5px',
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              Your File
            </Button>
          </Box>
        )}
      </div>
    </header>
  );
};

export default Header;
