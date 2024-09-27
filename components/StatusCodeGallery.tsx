'use client'

import { useState, useEffect, useRef,useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Grid, List } from 'lucide-react'
import statusCodes from '@/public/statusCodes.json'

type StatusCode = {
  code: number;
  reason: string;
  description: string;
  geekDescription: string;
  source: string;
  image: string | string[];
};


export default function Component() {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedImg, setSelectedImg] = useState<StatusCode | null>(null)
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [displayMode, setDisplayMode] = useState<string>('normal')
  const [randomIndices, setRandomIndices] = useState<Record<number, number>>({})

  // 使用 useRef 来存储最新的 selectedImg 和 modalOpen 值，避免不必要的渲染
  const selectedImgRef = useRef<StatusCode | null>(null)
  const modalOpenRef = useRef<boolean>(false)

  useEffect(() => {
    selectedImgRef.current = selectedImg
    modalOpenRef.current = modalOpen
  }, [selectedImg, modalOpen])

  const getCodeImg = (code: StatusCode) => {
    if (Array.isArray(code.image)) {
      return code.image[randomIndices[code.code] || 0]
    }
    return code.image
  }

  const filteredCodes = statusCodes.filter(code => 
    code.code.toString().includes(searchTerm) || 
    code.reason.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedCodes = statusCodes.reduce<Record<string, StatusCode[]>>((acc, code) => {
    const group = `${Math.floor(code.code / 100)}xx`
    if (!acc[group]) acc[group] = []
    acc[group].push(code)
    return acc
  }, {})

  // 将 navigateModal 函数移到组件外部
  const navigateModal = (direction: number, selectedImg: StatusCode | null,   setSelectedImg: React.Dispatch<React.SetStateAction<StatusCode | null>>) => {
    if (!selectedImg) return
    const currentIndex = statusCodes.findIndex(code => code.code === selectedImg.code)
    const newIndex = (currentIndex + direction + statusCodes.length) % statusCodes.length
    setSelectedImg(statusCodes[newIndex])
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!modalOpenRef.current) return
    if (e.key === 'ArrowLeft') navigateModal(-1, selectedImgRef.current, setSelectedImg)
    if (e.key === 'ArrowRight') navigateModal(1, selectedImgRef.current, setSelectedImg)
    if (e.key === 'Escape') setModalOpen(false)
  }, [])

  useEffect(() => {
    console.log('useEffect')
    // 如果对应状态码有多个图片，则每次会话期间生成一个随机index，用户刷新页面时随机选择一张图片
    const indices: Record<number, number> = {}
    statusCodes.forEach(code => {
      if (Array.isArray(code.image)) {
        indices[code.code] = Math.floor(Math.random() * code.image.length)
      }
    })
    setRandomIndices(indices)

    // 监听键盘事件
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === 'normal' ? 'grouped' : 'normal')
    setSearchTerm('')
  }

  const renderStatusCode = (code: StatusCode) => (
    <div
      key={code.code}
      className="border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => {
        setSelectedImg(code)
        setModalOpen(true)
      }}
    >
      <img src={getCodeImg(code)} alt={`HTTP ${code.code}`} className="w-full aspect-square object-cover mb-2 rounded" />
      <p className="font-bold">{code.code}</p>
      <p className="text-sm">{code.reason}</p>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">HTTP状态猫</h1>
      <h2 className="text-xl mb-4">让小猫们助你轻松掌握HTTP状态码!</h2>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex w-full gap-2">
          <Input
            type="text"
            placeholder="Search by status code or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            disabled={displayMode === 'grouped'}
          />
          <Button onClick={toggleDisplayMode} variant="outline" className="flex-shrink-0">
            {displayMode === 'normal' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {displayMode === 'normal' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCodes.map(renderStatusCode)}
        </div>
      )}

      {displayMode === 'grouped' && (
        <Tabs defaultValue="1xx" className="w-full">
          <TabsList className="mb-4 w-full justify-start overflow-x-auto bg-gray-100 p-1 rounded-lg">
            {Object.keys(groupedCodes).map((group) => (
              <TabsTrigger 
                key={group} 
                value={group} 
                className="flex-1 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                {group}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(groupedCodes).map(([group, codes]) => (
            <TabsContent key={group} value={group}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {codes.map(renderStatusCode)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}


      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>{selectedImg?.code} - {selectedImg?.reason}</DialogTitle>
          </DialogHeader>
          <div className="relative mb-4">
            <img src={selectedImg ? getCodeImg(selectedImg) : ''} alt={`HTTP ${selectedImg?.code}`} className="w-full aspect-square object-cover rounded" />
            <button
              onClick={() => navigateModal(-1, selectedImgRef.current, setSelectedImg)}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-20 text-white p-2 rounded-full focus:outline-none"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => navigateModal(1, selectedImgRef.current, setSelectedImg)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-20 text-white p-2 rounded-full focus:outline-none"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
          <div className="space-y-2">
            <p><strong>极客解释:</strong> {selectedImg?.geekDescription}</p>
            <p className='min-h-[80px]'><strong>描述:</strong> {selectedImg?.description}</p>
            <p><strong>来源:</strong> <a href={selectedImg?.source} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">MDN文档</a></p>
          </div>
          
        </DialogContent>
      </Dialog>
    </div>
  )
}