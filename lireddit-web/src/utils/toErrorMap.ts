import { FieldError } from "../generated/graphql";
//graphQl requestinden geri dönen error lar i frontend de gösterebilmek icin kullanacagiz
export const toErrorMap=(errors:FieldError[])=>{
    const errorMap: Record<string,string>={}
    errors.forEach(({field, message})=>{
    errorMap[field]=message;            
    });
    return errorMap;
}