// Encode captioned walkthrough scene PNGs as a portable H.264 MP4.
// Usage: swift encode_walkthrough.swift <scene-directory> <output.mp4>
import Foundation
import AVFoundation
import AppKit
import CoreVideo
let directory=URL(fileURLWithPath:CommandLine.arguments[1])
let output=URL(fileURLWithPath:CommandLine.arguments[2])
let scenes=try FileManager.default.contentsOfDirectory(at:directory,includingPropertiesForKeys:nil).filter{$0.pathExtension=="png"}.sorted{$0.lastPathComponent<$1.lastPathComponent}
try? FileManager.default.removeItem(at:output)
let writer=try AVAssetWriter(outputURL:output,fileType:.mp4)
let width=1280,height=720,fps:Int32=10,seconds=6
let input=AVAssetWriterInput(mediaType:.video,outputSettings:[AVVideoCodecKey:AVVideoCodecType.h264,AVVideoWidthKey:width,AVVideoHeightKey:height,AVVideoCompressionPropertiesKey:[AVVideoAverageBitRateKey:1800000]])
input.expectsMediaDataInRealTime=false
let adaptor=AVAssetWriterInputPixelBufferAdaptor(assetWriterInput:input,sourcePixelBufferAttributes:[kCVPixelBufferPixelFormatTypeKey as String:kCVPixelFormatType_32ARGB,kCVPixelBufferWidthKey as String:width,kCVPixelBufferHeightKey as String:height,kCVPixelBufferCGImageCompatibilityKey as String:true,kCVPixelBufferCGBitmapContextCompatibilityKey as String:true])
writer.add(input);guard writer.startWriting() else {fatalError("Cannot start encoder: \(String(describing:writer.error))")};writer.startSession(atSourceTime:.zero)
var frame:Int64=0
for (sceneIndex,url) in scenes.enumerated(){
 let image=NSImage(contentsOf:url)!;var proposed=NSRect(x:0,y:0,width:width,height:height)
 let cg=image.cgImage(forProposedRect:&proposed,context:nil,hints:nil)!
 for local in 0..<(Int(fps)*seconds){
  while !input.isReadyForMoreMediaData {if writer.status == .failed{fatalError("Encoder failed: \(String(describing:writer.error))")};Thread.sleep(forTimeInterval:0.005)}
  var optional:CVPixelBuffer?;let status=CVPixelBufferPoolCreatePixelBuffer(nil,adaptor.pixelBufferPool!,&optional);guard status==kCVReturnSuccess,let pixel=optional else {fatalError("Pixel buffer allocation failed")}
  CVPixelBufferLockBaseAddress(pixel,[])
  let context=CGContext(data:CVPixelBufferGetBaseAddress(pixel),width:width,height:height,bitsPerComponent:8,bytesPerRow:CVPixelBufferGetBytesPerRow(pixel),space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.noneSkipFirst.rawValue)!
  context.draw(cg,in:CGRect(x:0,y:0,width:width,height:height))
  context.setFillColor(CGColor(red:0,green:0.65,blue:0.65,alpha:1))
  let progress=(Double(sceneIndex)+Double(local+1)/Double(Int(fps)*seconds))/Double(scenes.count)
  context.fill(CGRect(x:0,y:0,width:Double(width)*progress,height:5))
  CVPixelBufferUnlockBaseAddress(pixel,[])
  guard adaptor.append(pixel,withPresentationTime:CMTime(value:frame,timescale:fps)) else {fatalError("Append failed: \(String(describing:writer.error))")};frame+=1
 }
}
input.markAsFinished();let done=DispatchSemaphore(value:0);writer.finishWriting{done.signal()};done.wait()
guard writer.status == .completed else {fatalError("Encoding failed: \(String(describing:writer.error))")}
print("Encoded \(scenes.count) captioned scenes, \(frame/Int64(fps)) seconds: \(output.lastPathComponent)")
