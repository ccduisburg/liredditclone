import { MyContext } from "src/types";
import { Resolver, Query, Mutation, Ctx, Arg, Int, Field, ObjectType } from "type-graphql"
import { User } from "../entities/User";
import argon2 from 'argon2';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "../utils/UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import {v4} from 'uuid';
import { getConnection } from "typeorm";

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];
    @Field(() => User, { nullable: true })
    user?: User;
}

@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

@Resolver()
export class UserResolver {
    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() { redis, req }: MyContext
    ): Promise<UserResponse> {
        if (newPassword.length <= 3) {
            return {
                errors: [{
                    field: 'newPassword',
                    message: "length must be greater than 3"

                },]
            };

        }//token control
        const key=FORGET_PASSWORD_PREFIX+token
        const userId = await redis.get(key);
        if (!userId) {
            return {
                errors: [{
                    field: 'token',
                    message: "token expired"

                },]
            };
        }
        //update password
        const userIdNum=parseInt(userId)
        const user = await User.findOne(userIdNum);
        if (!user) {
            return {
                errors: [{
                    field: 'token',
                    message: "user no longer exists"

                },]
            };
        }
      
        await User.update({id:userIdNum},{password:await argon2.hash(newPassword),});
        //log in user after change password 
        await redis.del(key)
        req.session.userId=user.id;
        return {user};
    }
    //forgat password-------------
    @Mutation(() => Boolean)
    async forgotPassword(@Arg("email") email: string, @Ctx() { redis }: MyContext) {
        const user = await User.findOne({ where:{email} });
        if (!user) {
            return true;
        }

        const token = v4();
        await redis.set(FORGET_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 3)// 3 days
        await sendEmail(
            email, `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
        );
        return true;
    }
    
    @Query(() => User, { nullable: true })
     me(
        @Ctx() { req}: MyContext
    ) {//you are not logid in
        if (!req.session.userId) {
            return null
        }
       return  User.findOne(req.session.userId);        
    }

    @Query(() => [User])
    users(): Promise<User[]> {
        return User.find()
    }

    @Query(() => User, { nullable: true })
    user(
        @Arg("id", () => Int) id: number,
    ): Promise<User | undefined> {
        return User.findOne(id);
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("options") options: UsernamePasswordInput,      
    ): Promise<UserResponse> {
        const errors = validateRegister(options);
        if (errors) {
            return { errors };
        }
        const hashedPassword = await argon2.hash(options.password)       
        let user;
        try {
          const  result= await getConnection().createQueryBuilder().insert().into(User).values(          
                {
                    username: options.username,
                    email: options.email,
                    password: hashedPassword,}
              
                ).returning("*")
                .execute();
        user=result.raw[0];     
        } catch (error) {      
            if (error.code === "23505") {
                return {
                    errors: [
                        {
                            field: "username",
                            message: "username already taken",
                        }
                    ]
                }
            }
        }

        return { user, };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const user = await User.findOne(
            usernameOrEmail.includes('@')
            ? { where: {email: usernameOrEmail} }
            : { where :{ username: usernameOrEmail}});
        if (!user) {
            return {
                errors: [{
                    field: "usernameOrmail",
                    message: "that username does not exist",
                },],
            };
        }
        const valid = await argon2.verify(user.password, password);
        if (!valid) {
            return {
                errors: [{
                    field: "password",
                    message: "incorrect password",
                },],
            };

        }
        //store user id session
        //this will set a coolie on the user
        //keep them loggen in
        req.session.userId = user.id;
        return { user, };
    }
    @Mutation(() => Boolean)
    logout(
        @Ctx() { req, res }: MyContext
    ) {
        return new Promise((resolver) => req.session.destroy(err => {
            res.clearCookie(COOKIE_NAME);
            if (err) {
                console.log(err);
                resolver(false)
                return;
            }
            resolver(true)
        }))
    }

}