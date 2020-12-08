
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "src/types";
import { Resolver, Query, Mutation, Arg, Int, InputType, Field, Ctx, UseMiddleware } from "type-graphql"
import { Post } from "../entities/Post";
import { getConnection } from "typeorm";


@InputType()
class PostInput {
    @Field()
    title: string
    @Field()
    text: string
}

@Resolver()
export class PostResolver {
    @Query(() => [Post])
    async posts(
        @Arg('limit',()=>Int) limit: number,
        @Arg('cursor', () => String, { nullable: true }) cursor: string | null
    ): Promise<Post[]> {
        const realLimit=Math.min(50,limit);
        
         const qb= getConnection()
                .getRepository(Post)
                .createQueryBuilder("p")             
                .orderBy('"createdAt"',"DESC")
                .take(realLimit);                
                if(cursor){
                    qb.where('"createdAt"<:cursor',{cursor:new Date(parseInt(cursor))})
                }
            return qb.getMany();
    }

    @Query(() => Post, { nullable: true })
    post(
        @Arg("id", () => Int) id: number,
    ): Promise<Post | undefined> {
        return Post.findOne(id);
    }

    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createpost(
        @Arg("input") input: PostInput,
        @Ctx() { req }: MyContext
    ): Promise<Post> {

        let post: any;
        try {
            const result = await getConnection().createQueryBuilder().insert().into(Post).values(
                { ...input, creatorId: req.session.userId }
            ).returning("*")
                .execute();
            post = result.raw[0];
        } catch (error: any) {
            console.log(error);
        }
        return post;
    }
    @Mutation(() => Post)
    async updatePost(
        @Arg("id") id: number,
        @Arg("title", () => String, { nullable: true }) title: String,
    ): Promise<Post | null> {
        const post = await Post.findOne(id);
        if (!post) {
            return null
        }
        if (typeof title !== 'undefined') {
            await Post.update({ id }, { title });
        }
        return post;
    }
    @Mutation(() => Boolean)
    async deletePost(@Arg("id") id: number,
    ): Promise<boolean> {
        await Post.delete(id);
        return true
    }
}