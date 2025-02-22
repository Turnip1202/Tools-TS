import { FileRoutesByPath } from "./types"



type RoutePath<T extends Object> = {
    [K in keyof T]:T[K] extends {fullPath:infer U}?U:never
}[keyof T]


type MenuType = {
    title: string,
    to:RoutePath<FileRoutesByPath>
}[]

const menus: MenuType = [
    {title: "Home", to: "/"},
    {title: "register", to: "/front/register"},
    {title: "login", to: "/front/login"},
    {to:"/front/chapter/system",title:"system"},
    {to:"/front/chapter/system/dict",title:"dict"},
    {to:"/front/chapter/system/menu",title:"menu"},
    {to:"/front/chapter/system/role",title:"role"},
    {to:"/front/chapter/system/user",title:"user"},
]