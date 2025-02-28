import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CalendarDays } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CreateNewPost from './CreateNewPost'

const Posts = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "Welcome to Eventy",
      description: "Streamline your events through our platform!",
      image: "https://images.unsplash.com/photo-1487897068494-835d91e9ed8a?q=80&w=2015&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      author: {
        name: "Eventy Official",
        avatar: "https://api.dicebear.com/7.x/avatars/svg?seed=eventy",
      },
      date: "2024-02-20",
    },
  ])
  const navigate = useNavigate();

  const newPost = ()=>{

    navigate('/posts/createnewpost')

  }

  return (
    <div className="ml-0 md:ml-[270px] p-4 md:p-8 max-w-full mx-auto">
      <div className="mb-4 md:mb-8">
        <Button onClick={newPost} className="w-full sm:w-auto">
          Create New Post
        </Button>
      </div>

      <div className="space-y-2 sm:space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Avatar className="h-12 w-12 flex justify-center items-center rounded-full border-2 border-primary/10">
                  {/* <AvatarImage 
                    src={post.author.avatar} 
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/5 text-lg font-medium">
                    {post.author.name[0]}
                  </AvatarFallback> */}
                   <CalendarDays className="h-8 w-8 text-primary" />
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{post.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {post.author.name} • {new Date(post.date).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {post.image && (
              <div className="aspect-video w-full overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              </div>
            )}
            
            <CardContent className="pt-4 sm:pt-6">
              <p className="text-muted-foreground">
                {post.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Posts
