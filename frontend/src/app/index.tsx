import { RouterProvider } from "./providers";
import { AppRouter } from "./router";

function App() {
    console.log('App component rendered');
    
    return (
        <RouterProvider>
            <AppRouter />
        </RouterProvider>
    )
}

export default App;