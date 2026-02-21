import { AppkitDebugger } from '../components/AppkitDebugger';
import { CustomLoginButton } from '../components/CustomLoginButton';

/**
 * AppkitTest - A page to test Appkit authentication
 *
 * This page provides a simple interface to test Appkit authentication
 * and debug any issues.
 */
export default function AppkitTest() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Appkit Authentication Test</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Connect with Appkit</h2>
        <p className="mb-4">
          Click the button below to test Appkit authentication. This will open the Appkit modal
          where you can connect with a wallet or social provider.
        </p>

        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          <CustomLoginButton />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Debugging Tools</h2>
        <AppkitDebugger />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Troubleshooting</h2>
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-2">Common Issues:</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Social login not working:</strong> Check the browser console for errors. Make sure the Appkit event listener is working.
            </li>
            <li>
              <strong>Backend authentication failing:</strong> Check the server logs for errors. Make sure the backend route is correctly handling the authentication request.
            </li>
            <li>
              <strong>User not being created:</strong> Check the database to see if the user is being created. Make sure the user model is correctly configured.
            </li>
            <li>
              <strong>Token not being stored:</strong> Check if the token is being stored in localStorage. Try clearing localStorage and trying again.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
