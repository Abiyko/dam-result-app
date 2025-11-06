import * as auth0 from '@auth0/auth0-spa-js';

const config = {
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID, 
    redirectUri: import.meta.env.VITE_AUTH0_REDIRECT_URI,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE
};

// 状態管理用の変数
let auth0Client = null;

// SDKクライアントの初期化
const configureClient = async () => {
    auth0Client = await auth0.createAuth0Client({
        domain: config.domain,
        clientId: config.clientId,
        authorizationParams: {
            redirect_uri: config.redirectUri,
            scope: 'openid profile email',
            audience: config.audience
        }
    });
};

// ログイン処理 (Auth0へのリダイレクト)
const login = async () => {
    await auth0Client.loginWithRedirect();
};

// コールバック処理 (トークン取得)
const handleCallback = async () => {
    if (window.location.search.includes('code=')) {
        try {
            await auth0Client.handleRedirectCallback();
            // アクセストークンとユーザー情報の取得 (デバッグ用)
            const token = await auth0Client.getTokenSilently();
            const user = await auth0Client.getUser();
            
            // URLからコードを削除し、クリーンな状態に戻す
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            console.error("コールバック処理中にエラーが発生しました:", error);
        }
    }
};

// ログアウト処理
const logout = () => {
    auth0Client.logout({
        logoutParams: {
            returnTo: window.location.origin
        }
    });
};

const callProtectedApi = async () => {
    try {
        const accessToken = await auth0Client.getTokenSilently();
        
        const response = await fetch('/api/run-script', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            alert("保護されたアクションが正常に実行されました！");
        } else {
            console.error("API呼び出し失敗:", response.statusText);
            alert("APIサーバー側で認証または実行エラーが発生しました。");
        }
    } catch (error) {
        console.error("API呼び出しエラー:", error);
    }
};

// 初期化と実行
window.onload = async () => {
    if (typeof auth0 === 'undefined') {
        console.error("Auth0 SDKが読み込まれていません。");
        return;
    }

    await configureClient(); // クライアント初期化
    await handleCallback();  // コールバックURLで実行
    
    const isAuthenticated = await auth0Client.isAuthenticated();
    const loginButton = document.getElementById('login-btn');
    const protectedButton = document.getElementById('update-btn');
    
    if (!loginButton) {
        console.error("HTML内にID 'login-btn' の要素が見つかりません。");
        return;
    }

    // ログイン/ログアウトを切り替える新しいハンドラーを定義
    const handleLoginLogout = () => {
        if (isAuthenticated) {
            logout();
        } else {
            login();
        }
    };
    
    // UIの更新
    if (isAuthenticated) {
        loginButton.textContent = 'Log out';
        protectedButton.style.display = 'block'; 
        protectedButton.addEventListener('click', callProtectedApi);
    } else {
        loginButton.textContent = 'Log in';
        protectedButton.style.display = 'none';
    }

    // 常にこの新しい動的ハンドラーを設定
    loginButton.addEventListener('click', handleLoginLogout);
};