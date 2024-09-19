import React, { useEffect, useState, useRef } from 'react';
import { View, Image, StyleSheet, Button } from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';

interface ImageResponse {
  src: string;
  alt: string;
}

const StillSpace: React.FC = () => {
  const sound = useRef(new Audio.Sound());
  const [images, setImages] = useState<ImageResponse[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  useEffect(() => {
    fetchImages();
    loadSound();

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => {
      clearInterval(interval);
      if (sound) {
        sound.current.unloadAsync();
      }
    };
  }, [images]);

  const fetchImages = async () => {
    try {
      const response = await axios.get<ImageResponse[]>('https://web-images-scraper-api-site-fc7f0d9b2e26.herokuapp.com/');
      // setImages(response.data);
      const responseData = [{ "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/beautiful-green-field-scenery-free-image.jpg?w=600\u0026quality=80", "alt": "Beautiful Green Field Scenery Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/beautiful-nature-mountain-scenery-with-flowers-free-photo.jpg?w=600\u0026quality=80", "alt": "Beautiful Nature Mountain Scenery with Flowers Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/magical-spring-forest-scenery-during-morning-breeze-free-photo.jpg?w=600\u0026quality=80", "alt": "Magical Spring Forest Scenery During Morning Breeze Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/text-nature-metal-letters-on-a-rock-in-green-forest-free-photo.jpg?w=600\u0026quality=80", "alt": "Text NATURE Metal Letters on a Rock in Green Forest Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/autumn-forest-road-from-above-free-photo.jpg?w=600\u0026quality=80", "alt": "Autumn Forest Road from Above Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/camping-on-top-of-the-mountain-during-sunset-free-photo.jpg?w=600\u0026quality=80", "alt": "Camping on Top of The Mountain During Sunset Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/pure-nature-landscape-single-tree-in-green-field-free-photo.jpg?w=600\u0026quality=80", "alt": "Pure Nature Landscape Single Tree in Green Field Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/romantic-tropical-beach-with-villa-and-palms-during-beautiful-sunset-free-photo.jpg?w=600\u0026quality=80", "alt": "Romantic Tropical Beach with Villa and Palms During Beautiful Sunset Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/amazing-stone-path-in-forest-free-image.jpg?w=600\u0026quality=80", "alt": "Amazing Stone Path in Forest Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/welcoming-seljalandsfoss-waterfall-free-photo.jpg?w=600\u0026quality=80", "alt": "Welcoming Seljalandsfoss Waterfall Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/the-great-dolomites-road-italy-free-photo.jpg?w=600\u0026quality=80", "alt": "The Great Dolomites Road, Italy Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/krivan-peak-slovakia-free-image.jpg?w=600\u0026quality=80", "alt": "Krivan Peak Slovakia Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/couple-relaxing-after-mountain-hiking-free-photo.jpg?w=600\u0026quality=80", "alt": "Couple Relaxing After Mountain Hiking Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/colorful-meadow-flowers-under-the-mountains-free-image.jpeg?w=600\u0026quality=80", "alt": "Colorful Meadow Flowers Under the Mountains Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/breathtaking-bali-nature-free-photo.jpg?w=600\u0026quality=80", "alt": "Breathtaking Bali Nature Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/crushing-wave-near-norwegian-shore-free-photo.jpg?w=600\u0026quality=80", "alt": "Crushing Wave near Norwegian Shore Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/sunset-golden-hour-in-kenya-safari-free-photo.jpg?w=600\u0026quality=80", "alt": "Sunset Golden Hour in Kenya Safari Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/skogafoss-best-iceland-waterfalls-free-photo.jpg?w=600\u0026quality=80", "alt": "Skógafoss Best Iceland Waterfalls Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/aerial-view-of-a-lonely-road-in-the-woods-free-photo.jpg?w=600\u0026quality=80", "alt": "Aerial View of a Lonely Road in the Woods Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/kirkjufell-mountain-free-photo.jpg?w=600\u0026quality=80", "alt": "Kirkjufell Mountain Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/perfect-winter-scenery-in-the-mountains-free-image.jpg?w=600\u0026quality=80", "alt": "Perfect Winter Scenery in The Mountains Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/red-roses-close-up-background-free-photo.jpg?w=600\u0026quality=80", "alt": "Red Roses Close Up Background Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/tropical-plant-leaves-dark-background-free-photo.jpg?w=600\u0026quality=80", "alt": "Tropical Plant Leaves Dark Background Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/sky-with-clouds-during-sunset-free-photo.jpg?w=600\u0026quality=80", "alt": "Sky with Clouds During Sunset Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/alpine-roads-at-passo-di-giau-dolomites-italy-free-photo.jpg?w=600\u0026quality=80", "alt": "Alpine Roads at Passo di Giau, Dolomites, Italy Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/rocky-sea-coast-in-croatia-free-photo.jpg?w=600\u0026quality=80", "alt": "Rocky Sea Coast in Croatia Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/road-in-the-woods-aerial-free-image.jpg?w=600\u0026quality=80", "alt": "Road in the Woods Aerial Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/tropical-nature-background-free-image.jpeg?w=600\u0026quality=80", "alt": "Tropical Nature Background Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/free-autumn-background-with-orange-leaves-and-space-for-text-free-image.jpeg?w=600\u0026quality=80", "alt": "Free Autumn Background with Orange Leaves and Space for Text Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/beautiful-autumn-nature-with-trees-of-yellow-leaves-free-image.jpeg?w=600\u0026quality=80", "alt": "Beautiful Autumn Nature with Trees of Yellow Leaves Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/calm-river-in-the-middle-of-an-autumn-forest-free-image.jpeg?w=600\u0026quality=80", "alt": "Calm River in the Middle of an Autumn Forest Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/detail-of-fallen-autumn-leaves-in-a-river-free-image.jpeg?w=600\u0026quality=80", "alt": "Detail of Fallen Autumn Leaves in a River Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/red-grapes-in-a-vineyard-free-image.jpg?w=600\u0026quality=80", "alt": "Red Grapes in a Vineyard Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/autumn-background-with-space-for-text-and-leaves-around-free-image.jpeg?w=600\u0026quality=80", "alt": "Autumn Background with Space for Text and Leaves Around Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/rose-blossoms-after-the-rain-free-image.jpg?w=600\u0026quality=80", "alt": "Rose Blossoms After the Rain Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/above-the-clouds-free-image.jpg?w=600\u0026quality=80", "alt": "Above the Clouds Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/beautiful-glowing-autumn-tree-with-yellow-leaves-free-image.jpeg?w=600\u0026quality=80", "alt": "Beautiful Glowing Autumn Tree with Yellow Leaves Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/old-oil-painting-of-a-wedding-couple-in-the-countryside-free-image.jpg?w=600\u0026quality=80", "alt": "Old Oil Painting of a Wedding Couple in the Countryside Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/carpenter-bee-on-lavender-flower-free-image.jpg?w=600\u0026quality=80", "alt": "Carpenter Bee on Lavender Flower Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/small-green-strawberry-fruit-before-ripening-free-image.jpg?w=600\u0026quality=80", "alt": "Small Green Strawberry Fruit Before Ripening Free Photo" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/motor-yacht-sailing-in-the-sea-aerial-view-free-image.jpeg?w=600\u0026quality=80", "alt": "Motor Yacht Sailing in the Sea Aerial View Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/small-waterfall-in-the-middle-of-a-green-forest-free-image.jpg?w=600\u0026quality=80", "alt": "Small Waterfall in the Middle of a Green Forest Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/beautiful-painting-of-a-sunset-at-the-beach-with-palm-trees-free-image.jpg?w=600\u0026quality=80", "alt": "Beautiful Painting of a Sunset at the Beach with Palm Trees Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/solitary-tree-with-yellow-autumn-leaves-in-the-middle-of-the-forest-free-image.jpeg?w=600\u0026quality=80", "alt": "Solitary Tree with Yellow Autumn Leaves in the Middle of the Forest Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/beautiful-colorful-autumn-forest-covered-in-morning-mist-free-image.jpeg?w=600\u0026quality=80", "alt": "Beautiful Colorful Autumn Forest Covered in Morning Mist Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/camping-on-a-mountain-peak-free-image.jpg?w=600\u0026quality=80", "alt": "Camping on a Mountain Peak Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/lights-of-passing-cars-in-the-middle-of-a-dark-forest-free-image.jpg?w=600\u0026quality=80", "alt": "Lights of Passing Cars in the Middle of a Dark Forest Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/yellow-roses-free-image.jpg?w=600\u0026quality=80", "alt": "Yellow Roses Free Image" }, { "src": "https://i0.wp.com/picjumbo.com/wp-content/uploads/beautiful-autumn-lake-free-image.jpg?w=600\u0026quality=80", "alt": "Beautiful Autumn Lake Free Photo" }]
      setImages(responseData);

      console.log(response.data)
    } catch (error) {
      console.error(error);
    }
  };

  const loadSound = async () => {
    try {
      await sound.current.loadAsync(require('../../assets/focused.mp3'));
      await sound.current.playAsync();
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  };


  return (
    <View style={styles.container}>
      {images.length > 0 && (
        <Image
          source={{ uri: images[currentImageIndex].src }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      {/* <Button title="Stop Music" onPress={() => sound && sound.stopAsync()} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
});

export default StillSpace;
