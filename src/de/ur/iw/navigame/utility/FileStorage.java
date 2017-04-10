package de.ur.iw.navigame.utility;

import javax.servlet.ServletContext;
import java.io.*;

/**
 * Helper class that facilitates storing and loading files.
 */
public class FileStorage {

    private static ServletContext sc;

    /**
     * In order to get the local file path of the application (where the "war" is located)
     * this class needs a reference to the ServletContext.
     *
     * @param context servlet context for this application.
     */
    public static void setServletContext(ServletContext context) {
        sc = context;
    }

    /**
     * Stores a (text) file on this server.
     *
     * @param name how the file should be called
     * @param contents the text for the file
     */
    public static void storeFile(String name, String contents) {
        try {
            FileWriter w = new FileWriter(getPath() + name);
            w.write(contents);
            w.flush();
            w.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * Stores an image file on this server. Different from {@link FileStorage#storeFile(String, String)} because
     * Strings cause problems with images.
     *
     * @param name how the file should be called.
     * @param contents bytes of the image file
     */
    public static void storeImageFile(String name, byte[] contents) {
        try {
            FileOutputStream w = new FileOutputStream(getPath() + name);
            w.write(contents);
            w.flush();
            w.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * Checks if a file exists for a given file name.
     * @param name name of the file
     * @return true, if it exists; false, otherwise
     */
    public static boolean fileExists(String name) {
        return new File(getPath() + name).exists();
    }

    /**
     * Loads a file and hands its contents to the consumer, if everything went OK
     *
     * @param name name of the file
     * @param onSuccess success callback, will receive the contents of the file
     * @param onFail error callback
     */
    public static void loadFile(String name, J7Consumer<String> onSuccess, J7Consumer<Void> onFail) {
        try {
            BufferedReader reader = new BufferedReader(new FileReader(getPath() + name));
            StringBuilder b = new StringBuilder();
            String line;
            while((line = reader.readLine()) != null) {
                b.append(line).append("\n");
            }
            reader.close();
            onSuccess.accept(b.toString());
        } catch (IOException e) {
            e.printStackTrace();
            onFail.accept(null);
        }
    }

    /**
     * Loads a file and returns its contents directly (without using a callback)
     *
     * @param name file name
     * @return the contents of the file, as a String
     */
    public static String loadFileNoCallback(String name) {
        try {
            BufferedReader reader = new BufferedReader(new FileReader(getPath() + name));
            StringBuilder b = new StringBuilder();
            String line;
            while((line = reader.readLine()) != null) {
                b.append(line).append("\n");
            }
            reader.close();
            return b.toString();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Returns the path where the WAR is located.
     *
     * @return the server's path on the server machine.
     */
    private static String getPath() {
        return sc.getRealPath("/");
    }

}
