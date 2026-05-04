import { toCamelCaseObject } from "../lib/utils";

const getAuthHeader = () => {
  const session = localStorage.getItem("app_session");
  if (session) {
    const { token } = JSON.parse(session);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  return {};
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
        ...(options.headers || {}),
      },
    });
    const contentType = response.headers.get("content-type");
    const text = await response.clone().text();
    let result;

    if (contentType && contentType.includes("application/json")) {
      try {
        result = JSON.parse(text);
      } catch (e: any) {
        console.error(`Failed to parse JSON from ${endpoint}. Status: ${response.status}. Content snippet:`, text.substring(0, 100));
        throw new Error(`خطأ في معالجة البيانات المستلمة من الخادم. (Status: ${response.status})`);
      }
    } else {
      const status = response.status;
      console.error(`Non-JSON response (Status ${status}) from ${endpoint}:`, text.substring(0, 200));
      if (status === 404) {
        throw new Error(`الرابط غير موجود على الخادم (404). يرجى التأكد من أن النظام يعمل بشكل صحيح.`);
      }
      if (status === 403 || status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error(`استجابة غير صالحة من الخادم (تنسيق غير متوقع). Status: ${status}`);
    }
    
    if (!response.ok) {
      console.warn(`[API Response Error] ${endpoint} returned ${response.status}. Full result:`, result);
      console.warn(`Type of result: ${typeof result}, keys: ${result && typeof result === 'object' ? Object.keys(result).join(", ") : 'n/a'}`);
      let errorMessage = "حدث خطأ غير معروف أثناء معالجة الطلب (Fallback)";
      
      if (result) {
        if (typeof result === 'string') {
          errorMessage = result;
        } else if (result.error) {
          errorMessage = result.error;
          if (result.details) {
            const extra = Array.isArray(result.details)
              ? result.details.map((d: any) => d.message || JSON.stringify(d)).join(", ")
              : JSON.stringify(result.details);
            errorMessage += `: ${extra}`;
          }
        } else if (result.message) {
          errorMessage = result.message;
        } else if (result.details) {
          errorMessage = Array.isArray(result.details) 
            ? result.details.map((d: any) => d.message || JSON.stringify(d)).join(", ")
            : JSON.stringify(result.details);
        }
      }
      
      throw new Error(errorMessage);
    }
    
    // Transform snake_case from DB to camelCase for Frontend
    const transformed = toCamelCaseObject(result.data || result);
    return { data: transformed, error: null };
  } catch (error: any) {
    if (error.message !== "Access denied" && error.message !== "Unauthorized") {
      console.error(`API Error (${endpoint}):`, error.message);
    }
    return { data: null, error: error.message };
  }
};

export const dbQuery = async (_sql: string, _values?: any[]) => {
  console.warn("dbQuery is deprecated and insecure. Use specific API endpoints instead.");
  return { data: null, error: "Direct SQL queries are disabled for security reasons." };
};

export const apiLogin = async (credentials: any) => {
  return apiFetch("/api/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
};

export const apiSignup = async (userData: any) => {
  return apiFetch("/api/signup", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};
