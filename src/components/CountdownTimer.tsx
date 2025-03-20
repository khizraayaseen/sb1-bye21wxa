"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    // Set next release time to midnight EST
    const calculateTimeLeft = () => {
      const now = new Date()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      const difference = tomorrow.getTime() - now.getTime()

      return {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full flex justify-center py-4">
      <div className="inline-flex items-center bg-white rounded-full shadow-sm px-4 py-2">
        <Clock size={16} className="text-gray-500 mr-2" />
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap mr-2">
          Next Winning Product Released In :
        </span>

        <div className="flex items-center">
          <div className="bg-orange-100 rounded-full w-7 h-7 flex items-center justify-center mx-1">
            <span className="text-sm font-bold text-orange-500">{String(timeLeft.hours).padStart(2, "0")}</span>
          </div>
          <span className="text-xs text-gray-500 mr-2">Hours</span>
        </div>

        <div className="flex items-center">
          <div className="bg-orange-100 rounded-full w-7 h-7 flex items-center justify-center mx-1">
            <span className="text-sm font-bold text-orange-500">{String(timeLeft.minutes).padStart(2, "0")}</span>
          </div>
          <span className="text-xs text-gray-500 mr-2">Minutes</span>
        </div>

        <div className="flex items-center">
          <div className="bg-orange-100 rounded-full w-7 h-7 flex items-center justify-center mx-1">
            <span className="text-sm font-bold text-orange-500">{String(timeLeft.seconds).padStart(2, "0")}</span>
          </div>
          <span className="text-xs text-gray-500">Seconds</span>
        </div>
      </div>
    </div>
  )
}

export default CountdownTimer

