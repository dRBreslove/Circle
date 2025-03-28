import SwiftUI

@main
struct CircleApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Circle")
                    .font(.largeTitle)
                    .padding()
                
                Text("Welcome to Circle")
                    .font(.headline)
                    .padding()
                
                Text("Your secure group communication app")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .padding()
            }
            .navigationTitle("Circle")
        }
    }
}

#Preview {
    ContentView()
} 