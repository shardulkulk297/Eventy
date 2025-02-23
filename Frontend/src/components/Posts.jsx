import React, { use } from 'react'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from './ui/card'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share2 } from 'lucide-react'

const Posts = () => {
  const  [posts, setPosts] = useState([
    {
      id: 1,
      title: "Welcome to Eventy",
      description: "Streamline your events through our platform!",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&dpr=2&q=80",
      author: {
        name: "Eventy Official",
        avatar: "https://api.dicebear.com/7.x/avatars/svg?seed=eventy",
      },
      date: "2024-02-20",
      likes: 42,
      comments: 8,
    },
  ])
  return (
    <div className='container mx-auto py-8'>

      <div className='mb-8'>

        <Button className = 'w-full sm:w-auto'>
          Create New Post

        </Button>

      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {
          posts.map((post)=> (
              <Card key={post.id} className="overflow-hidden">

                {
                  post.image && (
                    <div className='aspect-video w-full overflow-hidden'>
                      <img 
                        src={post.image}
                        alt={post.title}
                        className='h-full w-full object-cover transition-transform hover:scale-105'
                      />

                    </div>
                  )
                }

                <CardHeader >
                  <div className='flex items-center gap-4'>
                    <Avatar>
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                    </Avatar>
                  </div>

                  <CardTitle className='text-lg'>{post.title}</CardTitle>
                  <CardDescription>
                    {post.author.name} • {new Date(post.date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className='text-muted-foreground'>
                    {post.description}
                  </p>
                </CardContent>

                <CardFooter className="flex justify-between">
                  <div className="flex gap-4">
                    <Button variant="ghost" size="sm" className="flex gap-1">
                      <Heart className='h-4 w-4'/>
                      <span>{post.likes}</span>

                    </Button>
                    <Button variant="ghost" size="sm" className="flex gap-1">
                      <MessageCircle className='h-4 w-4'/>
                      <span>{post.comments}</span>

                    </Button>
                  </div>

                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />

                  </Button>
                </CardFooter>

                
              </Card>
          ))
        }
      </div>
      
      
    </div>
  )
}

export default Posts
