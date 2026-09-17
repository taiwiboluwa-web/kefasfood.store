import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ImageOptimizerButton } from './components/ImageOptimizerButton';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ImageOptimizerButton />
    </>
  );
}
