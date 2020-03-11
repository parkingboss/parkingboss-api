export function navigate(url?: string) {
  url = url || window.location.toString();
  return `https://my.parkingboss.com/user/navigate?url=${encodeURI(url)}`;
}

export const logOut = `https://my.parkingboss.com/user/logOut`;
